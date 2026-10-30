import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchNearbyHealthPlaces } from "@/lib/integrations/google-places";
import { isOrganizationOpenNow } from "@/lib/ai/context";
import { loadInsuranceDiscoveryData } from "@/lib/institution-directory";
import { evaluateFacilityInsuranceCoverage } from "@/lib/insurance-domain";

function haversine(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,toRad=(d:number)=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const lat=Number(body.lat),lng=Number(body.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){
    return NextResponse.json({error:"Geçerli konum gerekli."},{status:400});
  }
  const kind=String(body.kind||"hospital");
  const orgType=kind==="pharmacy"?"PHARMACY":kind==="clinic"?"CLINIC":kind==="imaging"?"IMAGING_CENTER":kind==="laboratory"?"LABORATORY":"HOSPITAL";
  const googleType=kind==="pharmacy"?"pharmacy":kind==="doctor"?"doctor":"hospital";
  const skipGoogle=kind==="laboratory"||kind==="imaging";
  const insuranceProviderSlug=typeof body.insuranceProviderSlug==="string"?body.insuranceProviderSlug:null;
  const insuranceProviderId=typeof body.insuranceProviderId==="string"?body.insuranceProviderId:null;
  const productType=typeof body.productType==="string"?body.productType:null;
  const productId=typeof body.productId==="string"?body.productId:null;
  const networkId=typeof body.networkId==="string"?body.networkId:null;
  const hasInsuranceQuery=Boolean(insuranceProviderSlug||insuranceProviderId);

  const [local,google,insuranceData]=await Promise.all([
    prisma.organization.findMany({
      where:{
        status:"APPROVED",
        isPublished:true,
        verificationDocuments:{none:{status:"APPROVED",expiresAt:{lt:new Date()}}},
        type:orgType as any
      },
      include:{
        hours:true,
        insuranceContracts:{
          where:{isActive:true},
          include:{
            insuranceProvider:{
              select:{id:true,name:true,slug:true,isActive:true}
            }
          }
        }
      },
      take:100
    }),
    skipGoogle?Promise.resolve([]):searchNearbyHealthPlaces({lat,lng,type:googleType as any,radiusMeters:Number(body.radiusMeters||10000),maxResultCount:20})
      .catch(()=>[]),
    hasInsuranceQuery ? loadInsuranceDiscoveryData() : Promise.resolve({ insurers: [], agreements: [], legacyContracts: [] })
  ]);

  const resolvedInsurerId = hasInsuranceQuery
    ? (insuranceProviderId ||
        insuranceData.insurers.find((i) => i.slug === insuranceProviderSlug)?.id ||
        insuranceProviderSlug)
    : null;

  const localResults=local
    .filter((o) => (o.type as string) !== "INSURANCE_COMPANY")
    .map(o=>{
      const d=o.latitude!=null&&o.longitude!=null?haversine(lat,lng,o.latitude,o.longitude):null;
      const evalResult = resolvedInsurerId
        ? evaluateFacilityInsuranceCoverage({
            organizationId: o.id,
            insuranceProviderId: resolvedInsurerId,
            productType,
            productId,
            networkId,
            agreements: insuranceData.agreements,
            legacyContracts: insuranceData.legacyContracts,
          })
        : null;
      const insuranceMatch =
        evalResult?.eligibilityState === "CONFIRMED_MATCH"
          ? true
          : evalResult?.eligibilityState === "CONFIRMED_NON_MATCH"
          ? false
          : null;
      const insuranceBoost =
        evalResult?.eligibilityState === "CONFIRMED_MATCH"
          ? 20
          : evalResult?.eligibilityState === "PARTIAL_OR_RESTRICTED"
          ? 10
          : evalResult?.eligibilityState === "DECLARED_OR_UNVERIFIED"
          ? 6
          : 0;
      return {
        source:"alumas",
        id:o.id,name:o.name,type:o.type,address:o.address,
        lat:o.latitude,lng:o.longitude,
        distanceKm:d==null?null:Math.round(d*10)/10,
        openNow:isOrganizationOpenNow(o.hours),
        isOnDuty:o.isOnDuty,
        insuranceMatch,
        insuranceEligibilityState: evalResult?.eligibilityState ?? null,
        insuranceNote: evalResult?.note ?? null,
        verified:true,
        score:
          60+(o.isOnDuty?25:0)+(d!=null?Math.max(0,15-Math.min(15,d)):0)+insuranceBoost
      };
    });

  const googleResults=google.map(p=>{
    const d=p.latitude!=null&&p.longitude!=null?haversine(lat,lng,p.latitude,p.longitude):null;
    return {
      source:"google",
      id:p.id,name:p.displayName,type:p.primaryType,address:p.formattedAddress,
      lat:p.latitude,lng:p.longitude,
      distanceKm:d==null?null:Math.round(d*10)/10,
      openNow:p.openNow,
      isOnDuty:false,
      insuranceMatch:null,
      insuranceEligibilityState: resolvedInsurerId ? "UNKNOWN" : null,
      insuranceNote: null,
      verified:false,
      rating:p.rating,
      userRatingCount:p.userRatingCount,
      googleMapsUri:p.googleMapsUri,
      score:45+(p.openNow===true?15:0)+(d!=null?Math.max(0,15-Math.min(15,d)):0)+((p.rating||0)>=4.5?5:0)
    };
  });

  const results=[...localResults,...googleResults].sort((a,b)=>b.score-a.score).slice(0,30);

  return NextResponse.json({
    disclaimer:"Ben sağlık profesyoneli değilim.",
    policy:"Alumas doğrulanmış kurumları ile Google Places canlı yakınlık/açık-kapalı verisi birlikte gösterilir. Nöbetçi eczane bilgisi Google açık-kapalı verisiyle eş anlamlı kabul edilmez.",
    results
  });
}
