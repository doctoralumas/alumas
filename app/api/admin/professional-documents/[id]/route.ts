import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { verificationReadiness } from "@/lib/professional/verification";

export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  const user=await getSessionUser();
  if(!user || user.role!=="ADMIN") return NextResponse.json({error:"Yetkisiz."},{status:403});
  const b=await req.json().catch(()=>({}));
  if(!["APPROVED","REJECTED","UNDER_REVIEW","EXPIRED"].includes(b.status)) return NextResponse.json({error:"Geçersiz durum."},{status:400});

  const doc=await prisma.professionalVerificationDocument.update({
    where:{id:params.id},
    data:{
      status:b.status,
      reviewerNote:b.note||null,
      reviewedAt:new Date(),
      reviewedByUserId:user.id
    }
  });

  const account=await prisma.professionalAccount.findUnique({
    where:{id:doc.professionalAccountId},
    include:{documents:true,healthTourism:true}
  });
  if(!account) return NextResponse.json({document:doc});

  const readiness=verificationReadiness(account);
  const agencyOk=account.accountType!=="HEALTH_TOURISM_AGENCY" || account.healthTourism?.status==="APPROVED";
  if(readiness.ready && agencyOk){
    await prisma.professionalAccount.update({
      where:{id:account.id},
      data:{verificationStatus:"APPROVED",verifiedAt:new Date(),verifiedByUserId:user.id}
    });
  }
  return NextResponse.json({document:doc,readiness});
}
