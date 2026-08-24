import { NextRequest,NextResponse } from "next/server";
import { searchNearbyHealthPlaces } from "@/lib/integrations/google-places";

const ALLOWED=new Set(["hospital","doctor","pharmacy"]);

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const lat=Number(body.lat), lng=Number(body.lng);
  const type=String(body.type||"hospital");
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){
    return NextResponse.json({error:"Geçerli konum gerekli."},{status:400});
  }
  if(!ALLOWED.has(type)){
    return NextResponse.json({error:"Desteklenmeyen sağlık kurumu tipi."},{status:400});
  }

  try{
    const results=await searchNearbyHealthPlaces({
      lat,lng,type:type as "hospital"|"doctor"|"pharmacy",
      radiusMeters:Number(body.radiusMeters||10000),
      maxResultCount:Number(body.maxResultCount||10)
    });

    return NextResponse.json({
      disclaimer:"Ben sağlık profesyoneli değilim.",
      source:{
        provider:"Google Places API (New)",
        freshness:"live-request",
        note:"Açık/kapalı durumu Google Places currentOpeningHours alanından alınır."
      },
      results
    });
  }catch(err:any){
    return NextResponse.json({
      error:"Canlı Google Places verisi alınamadı.",
      detail:process.env.NODE_ENV==="development"?String(err?.message||err):undefined
    },{status:502});
  }
}
