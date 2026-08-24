import {prisma} from "@/lib/prisma";
import {audit} from "@/lib/audit";
import {currentUser} from "@/lib/auth";
import {analyzeNavigationIntent, navigationSummary} from "@/lib/ai-navigation";
import {buildNavigationSources} from "@/lib/ai-sources";
import {mandatoryHealthDisclaimer} from "@/lib/ai-commentary";
import {evidenceFor, evidenceBasedCommentary} from "@/lib/ai/medical-knowledge";
import {buildSafePersonalizationContext, personalizationNote} from "@/lib/ai-personalization";

function organizationTypeFor(facility: string | null) {
  if (facility === "PHARMACY") return "PHARMACY" as const;
  if (facility === "CLINIC" || facility === "LAB") return "CLINIC" as const;
  if (facility === "HOSPITAL") return "HOSPITAL" as const;
  return null;
}

export async function POST(req: Request) {
  let body: {message?: unknown; history?: unknown; personalize?: unknown};
  try { body = await req.json(); }
  catch { return Response.json({error:"Geçersiz istek."},{status:400}); }

  const message = String(body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const personalize = body.personalize === true;
  if (message.length < 3 || message.length > 1200) {
    return Response.json({error:"Lütfen 3-1200 karakter arasında bir açıklama yazın."},{status:400});
  }

  const intent = analyzeNavigationIntent(message);
  const now = new Date();
  let doctors: Array<Record<string, unknown>> = [];
  let organizations: Array<Record<string, unknown>> = [];

  if (intent.triage !== "emergency" && intent.specialty) {
    const rows = await prisma.doctor.findMany({
      where:{
        isVerified:true,
        isPublished:true,
        specialty:{contains:intent.specialty,mode:"insensitive"},
        ...(intent.locationHint && ["İstanbul","Ankara","İzmir","Bursa","Antalya"].includes(intent.locationHint)
          ? {city:{contains:intent.locationHint,mode:"insensitive"}}
          : {})
      },
      include:{
        organization:{select:{id:true,name:true,slug:true,city:true,district:true,address:true}},
        availabilities:{where:{isActive:true,startsAt:{gte:now}},orderBy:{startsAt:"asc"},take:1}
      },
      orderBy:[{rating:"desc"},{reviewCount:"desc"}],
      take:6
    });
    doctors = rows.map((d) => ({
      id:d.id, slug:d.slug, name:d.name, title:d.title, specialty:d.specialty, hospital:d.hospital,
      city:d.city, rating:d.rating, reviewCount:d.reviewCount, price:d.price,
      organization:d.organization,
      nextAvailable:d.availabilities[0]?.startsAt?.toISOString() || null
    }));
  }

  const orgType = organizationTypeFor(intent.facility);
  if (orgType || intent.triage === "emergency") {
    const rows = await prisma.organization.findMany({
      where:{
        status:"APPROVED", isPublished:true,
        ...(intent.triage === "emergency" ? {} : orgType ? {type:orgType} : {}),
        ...(intent.locationHint ? {OR:[
          {city:{contains:intent.locationHint,mode:"insensitive"}},
          {district:{contains:intent.locationHint,mode:"insensitive"}}
        ]} : {})
      },
      select:{id:true,slug:true,name:true,type:true,city:true,district:true,address:true,phone:true,isOnDuty:true},
      orderBy:[{isOnDuty:"desc"},{name:"asc"}],
      take:6
    });
    organizations = rows;
  }

  const user = await currentUser().catch(() => null);
  const personalization = personalize && user?.id ? await buildSafePersonalizationContext(user.id, intent.locationHint) : null;
  await audit({
    actorUserId:user?.id || null,
    action:"AI_NAVIGATE",
    entityType:"HealthNavigation",
    metadata:{triage:intent.triage,specialty:intent.specialty,facility:intent.facility,confidence:intent.confidence,resultCount:doctors.length+organizations.length,conversationTurns:history.length,personalizationEnabled:Boolean(personalization),personalizationFields:personalization?.usedFields || []},
    req
  });

  const evidence = evidenceFor(message, intent);
  const sources = buildNavigationSources({
    hasDoctors: doctors.length > 0,
    hasOrganizations: organizations.length > 0,
    hasAvailability: doctors.some((d:any) => Boolean(d.nextAvailable)),
    matchedSpecialty: Boolean(intent.specialty),
    evidence,
  });

  return Response.json({
    ok:true,
    data:{
      source:"alumas_navigation_engine_v2",
      summary:navigationSummary(intent),
      commentary:evidenceBasedCommentary(intent,evidence,{doctors:doctors.length,organizations:organizations.length}),
      personalization:{enabled:Boolean(personalization),note:personalizationNote(personalization),usedFields:personalization?.usedFields || [],dataMinimization:true,modelDisclosure:"Kişisel sağlık verileri bu sürümde harici bir dil modeline gönderilmez."},
      followUps:[
        ...(intent.specialty ? ["Neden bu branş?", "Neden bu doktorlar?"] : []),
        ...(sources.length ? ["Hangi kaynaklara göre?"] : []),
        "Başka hangi seçenekler var?"
      ].slice(0,4),
      sources,
      intent,
      doctors,
      organizations,
      safety:{
        diagnosis:false,
        prescription:false,
        disclaimer:mandatoryHealthDisclaimer,
        medicalKnowledgeConnected:true,
        knowledgeMode:"curated_versioned_sources",
        policy:"Ajan yalnız yönlendirme yapar; tanı, tedavi ve reçete üretmez."
      }
    }
  });
}
