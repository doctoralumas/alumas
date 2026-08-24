import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { PROFESSIONAL_ACCOUNT_CONFIG } from "@/lib/professional/account-config";

export async function POST(req:NextRequest){
  const user=await getSessionUser();
  if(!user) return NextResponse.json({error:"Oturum gerekli."},{status:401});
  const b=await req.json().catch(()=>({}));
  if(!(b.accountType in PROFESSIONAL_ACCOUNT_CONFIG)) return NextResponse.json({error:"Geçersiz hesap türü."},{status:400});
  if(b.accountType==="HEALTH_TOURISM_AGENCY") return NextResponse.json({error:"Acenteler belge doğrulamalı başvuru akışını kullanmalıdır."},{status:400});
  const account=await prisma.professionalAccount.create({
    data:{ownerUserId:user.id,accountType:b.accountType,displayName:String(b.displayName||"").trim(),verificationStatus:"PENDING"}
  });
  return NextResponse.json({account,canOperate:false});
}
