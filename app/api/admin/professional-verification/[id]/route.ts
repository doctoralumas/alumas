import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  const user=await getSessionUser();
  if(!user || user.role!=="ADMIN") return NextResponse.json({error:"Yetkisiz."},{status:403});
  const b=await req.json().catch(()=>({}));
  if(!["APPROVED","REJECTED","UNDER_REVIEW","SUSPENDED"].includes(b.status)) return NextResponse.json({error:"Geçersiz durum."},{status:400});
  const current=await prisma.professionalAccount.findUnique({where:{id:params.id},include:{healthTourism:true}});
  if(!current) return NextResponse.json({error:"Kayıt bulunamadı."},{status:404});

  if(current.accountType==="HEALTH_TOURISM_AGENCY" && b.status==="APPROVED" && current.healthTourism?.status!=="APPROVED"){
    return NextResponse.json({error:"Sağlık turizmi yetki belgesi onaylanmadan acente hesabı aktifleştirilemez."},{status:409});
  }
  const account=await prisma.professionalAccount.update({
    where:{id:params.id},
    data:{verificationStatus:b.status,verifiedAt:b.status==="APPROVED"?new Date():null,verifiedByUserId:b.status==="APPROVED"?user.id:null,suspensionReason:b.reason||null}
  });
  return NextResponse.json({account});
}
