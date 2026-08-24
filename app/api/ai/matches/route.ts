import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSpecialtyMatch, scoreContextualDoctorMatch } from "@/lib/ai/match-engine";
import { hoursUntil, isOrganizationOpenNow, isSameLocalDay } from "@/lib/ai/context";

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
  const limit=Math.min(20,Math.max(1,Number(body.limit||8)));
  const now=new Date();

  const doctors=await prisma.doctor.findMany({
    where:{isVerified:true,isPublished:true},
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
            include:{insuranceProvider:true}
          }
        }
      }
    },
    take:150
  });

  const ranked=doctors.map(d=>{
    const org=d.organization;
    let distanceKm:number|null=null;
    if(lat!=null&&lng!=null&&org?.latitude!=null&&org?.longitude!=null){
      distanceKm=haversine(lat,lng,org.latitude,org.longitude);
    }
    const next=d.availabilities[0]?.startsAt ?? null;
    const openNow=org?isOrganizationOpenNow(org.hours,now):null;
    const insuranceMatch=insuranceProviderSlug
      ? !!org?.insuranceContracts.some(c=>c.insuranceProvider.slug===insuranceProviderSlug)
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
