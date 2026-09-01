import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id} = await params;
  const user=await getSessionUser();
  if(!user || user.role!=="ADMIN") return NextResponse.json({error:"Yetkisiz."},{status:403});
  const b=await req.json().catch(()=>({}));
  if(!["APPROVED","REJECTED","UNDER_REVIEW","EXPIRED"].includes(b.status)) return NextResponse.json({error:"Geçersiz durum."},{status:400});
  const auth=await prisma.healthTourismAuthorization.update({
    where:{id},
    data:{status:b.status,checkedAt:new Date(),checkedByUserId:user.id,reviewerNote:b.note||null}
  });
  return NextResponse.json({authorization:auth});
}
