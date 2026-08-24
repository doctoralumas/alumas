import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOrganizationOpenNow } from "@/lib/ai/context";

function haversine(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,toRad=(d:number)=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const lat=typeof body.lat==="number"?body.lat:null;
  const lng=typeof body.lng==="number"?body.lng:null;
  const type=typeof body.type==="string"?body.type:null;
  const insuranceProviderSlug=typeof body.insuranceProviderSlug==="string"?body.insuranceProviderSlug:null;

  const rows=await prisma.organization.findMany({
    where:{
      status:"APPROVED",isPublished:true,
      ...(type?{type:type as any}:{})
    },
    include:{
      hours:true,
      insuranceContracts:{where:{isActive:true},include:{insuranceProvider:true}}
    },
    take:150
  });

  const results=rows.map(o=>{
    const openNow=isOrganizationOpenNow(o.hours);
    const distanceKm=lat!=null&&lng!=null&&o.latitude!=null&&o.longitude!=null
      ? haversine(lat,lng,o.latitude,o.longitude):null;
    const insuranceMatch=insuranceProviderSlug
      ? o.insuranceContracts.some(c=>c.insuranceProvider.slug===insuranceProviderSlug):null;
    let score=50;
    if(o.isOnDuty) score+=25;
    else if(openNow===true) score+=15;
    if(distanceKm!=null) score+=Math.max(0,20-Math.min(20,distanceKm));
    if(insuranceMatch===true) score+=15;
    if(insuranceMatch===false) score-=10;
    return {
      id:o.id,slug:o.slug,name:o.name,type:o.type,city:o.city,district:o.district,address:o.address,
      distanceKm:distanceKm==null?null:Math.round(distanceKm*10)/10,
      openNow,isOnDuty:o.isOnDuty,insuranceMatch,score:Math.round(score),
      why:[
        ...(o.isOnDuty?["Nöbetçi"]:openNow===true?["Şu anda açık"]:[]),
        ...(distanceKm!=null&&distanceKm<=10?["Yakın konum"]:[]),
        ...(insuranceMatch===true?["Sigorta uyumu var"]:[])
      ]
    }
  }).sort((a,b)=>b.score-a.score).slice(0,20);

  return NextResponse.json({
    disclaimer:"Ben sağlık profesyoneli değilim.",
    results
  });
}
