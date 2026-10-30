import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSpecialtyMatch, scoreContextualDoctorMatch } from "@/lib/ai/match-engine";
import { hoursUntil, isOrganizationOpenNow, isSameLocalDay } from "@/lib/ai/context";
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
  const specialty=typeof body.specialty==="string"?body.specialty:"";
  const lat=typeof body.lat==="number"?body.lat:null;
  const lng=typeof body.lng==="number"?body.lng:null;
  const insuranceProviderSlug=typeof body.insuranceProviderSlug==="string"?body.insuranceProviderSlug:null;
  const insuranceProviderId=typeof body.insuranceProviderId==="string"?body.insuranceProviderId:null;
  const productType=typeof body.productType==="string"?body.productType:null;
  const productId=typeof body.productId==="string"?body.productId:null;
  const networkId=typeof body.networkId==="string"?body.networkId:null;
  const hasInsuranceQuery=Boolean(insuranceProviderSlug||insuranceProviderId);
  const limit=Math.min(20,Math.max(1,Number(body.limit||8)));
  const now=new Date();

  const [doctors, insuranceData]=await Promise.all([
    prisma.doctor.findMany({
      where:{isVerified:true,isPublished:true,verificationDocuments:{none:{status:"APPROVED",expiresAt:{lt:new Date()}}}},
      include:{
        availabilities:{
          where:{isActive:true,startsAt:{gte:now}},
          orderBy:{startsAt:"asc"},
          take:1
        },
        organization:{
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
          }
        }
      },
      take:150
    }),
    hasInsuranceQuery ? loadInsuranceDiscoveryData() : Promise.resolve({ insurers: [], agreements: [], legacyContracts: [] })
  ]);

  const resolvedInsurerId = hasInsuranceQuery
    ? (insuranceProviderId ||
        insuranceData.insurers.find((i) => i.slug === insuranceProviderSlug)?.id ||
        insuranceProviderSlug)
    : null;

  const ranked=doctors.map(d=>{
    const org=d.organization;
    let distanceKm:number|null=null;
    if(lat!=null&&lng!=null&&org?.latitude!=null&&org?.longitude!=null){
      distanceKm=haversine(lat,lng,org.latitude,org.longitude);
    }
    const next=d.availabilities[0]?.startsAt ?? null;
    const openNow=org?isOrganizationOpenNow(org.hours,now):null;

    const evalResult =
      resolvedInsurerId && org
        ? evaluateFacilityInsuranceCoverage({
            organizationId: org.id,
            insuranceProviderId: resolvedInsurerId,
            productType,
            productId,
            networkId,
            specialtyCode: specialty || d.specialty,
            agreements: insuranceData.agreements,
            legacyContracts: insuranceData.legacyContracts,
            now,
          })
        : null;

    const insuranceMatch =
      evalResult?.eligibilityState === "CONFIRMED_MATCH"
        ? true
        : evalResult?.eligibilityState === "CONFIRMED_NON_MATCH"
        ? false
        : null;
    const insuranceEligibilityState = evalResult
      ? evalResult.eligibilityState
      : resolvedInsurerId
      ? "UNKNOWN"
      : null;

    const breakdown=scoreContextualDoctorMatch({
      specialtyMatch:normalizeSpecialtyMatch(specialty,d.specialty),
      distanceKm,
      hasAvailabilityToday:next?isSameLocalDay(next,now):false,
      nextAvailableHours:next?hoursUntil(next,now):null,
      verificationScore:d.isVerified?1:0,
      organizationPublished:org?org.isPublished:true,
      organizationOpenNow:openNow,
      organizationOnDuty:org?.isOnDuty ?? false,
      insuranceMatch,
      insuranceEligibilityState,
      rating:d.rating,
      reviewCount:d.reviewCount
    });

    return {
      id:d.id,slug:d.slug,name:d.name,specialty:d.specialty,title:d.title,
      hospital:d.hospital,city:d.city,rating:d.rating,reviewCount:d.reviewCount,
      nextSlot:next,
      distanceKm:distanceKm==null?null:Math.round(distanceKm*10)/10,
      organizationOpenNow:openNow,
      organizationOnDuty:org?.isOnDuty ?? false,
      insuranceMatch,
      insuranceEligibilityState,
      insuranceNote: evalResult?.note ?? null,
      matchScore:breakdown.total,
      why:breakdown.reasons,
      breakdown
    };
  }).sort((a,b)=>b.matchScore-a.matchScore).slice(0,limit);

  return NextResponse.json({
    disclaimer:"Ben sağlık profesyoneli değilim.",
    rankingPolicy:"Sonuçlar; branş uyumu, gerçek konum, bugün/yakın tarih müsaitliği, doğrulama, kurumun açık/nöbetçi durumu, varsa sigorta uyumu ve değerlendirme sinyalleriyle sıralanır.",
    results:ranked
  });
}
