import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchNearbyHealthPlaces } from "@/lib/integrations/google-places";
import { isOrganizationOpenNow } from "@/lib/ai/context";

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
  const orgType=kind==="pharmacy"?"PHARMACY":kind==="clinic"?"CLINIC":"HOSPITAL";
  const googleType=kind==="pharmacy"?"pharmacy":kind==="doctor"?"doctor":"hospital";
  const insuranceProviderSlug=typeof body.insuranceProviderSlug==="string"?body.insuranceProviderSlug:null;

  const [local,google]=await Promise.all([
    prisma.organization.findMany({
      where:{status:"APPROVED",isPublished:true,type:orgType as any},
      include:{
        hours:true,
        insuranceContracts:{where:{isActive:true},include:{insuranceProvider:true}}
      },
      take:100
    }),
    searchNearbyHealthPlaces({lat,lng,type:googleType as any,radiusMeters:Number(body.radiusMeters||10000),maxResultCount:20})
      .catch(()=>[])
  ]);

  const localResults=local.map(o=>{
    const d=o.latitude!=null&&o.longitude!=null?haversine(lat,lng,o.latitude,o.longitude):null;
    const insuranceMatch=insuranceProviderSlug
      ? o.insuranceContracts.some(c=>c.insuranceProvider.slug===insuranceProviderSlug):null;
    return {
      source:"alumas",
      id:o.id,name:o.name,type:o.type,address:o.address,
      lat:o.latitude,lng:o.longitude,
      distanceKm:d==null?null:Math.round(d*10)/10,
      openNow:isOrganizationOpenNow(o.hours),
      isOnDuty:o.isOnDuty,
      insuranceMatch,
      verified:true,
      score:
        60+(o.isOnDuty?25:0)+(d!=null?Math.max(0,15-Math.min(15,d)):0)+(insuranceMatch===true?15:0)
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
