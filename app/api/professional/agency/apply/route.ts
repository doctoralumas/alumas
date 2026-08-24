import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req:NextRequest){
  const user=await getSessionUser();
  if(!user) return NextResponse.json({error:"Oturum gerekli."},{status:401});
  const b=await req.json().catch(()=>({}));
  for(const key of ["displayName","authorizationNumber","issuer"]){
    if(!String(b[key]||"").trim()) return NextResponse.json({error:`${key} zorunludur.`},{status:400});
  }
  const account=await prisma.professionalAccount.create({
    data:{
      ownerUserId:user.id, accountType:"HEALTH_TOURISM_AGENCY",
      displayName:String(b.displayName).trim(), verificationStatus:"PENDING",
      healthTourism:{create:{
        authorizationNumber:String(b.authorizationNumber).trim(),
        issuer:String(b.issuer).trim(),
        issuedAt:b.issuedAt?new Date(b.issuedAt):null,
        expiresAt:b.expiresAt?new Date(b.expiresAt):null,
        documentId:b.documentId||null,status:"PENDING"
      }}
    }, include:{healthTourism:true}
  });
  return NextResponse.json({account,status:"PENDING",canOperate:false});
}
