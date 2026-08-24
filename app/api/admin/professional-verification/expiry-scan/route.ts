import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(){
  const user=await getSessionUser();
  if(!user || user.role!=="ADMIN") return NextResponse.json({error:"Yetkisiz."},{status:403});
  const now=new Date();
  const expired=await prisma.professionalVerificationDocument.findMany({
    where:{expiresAt:{lt:now},status:"APPROVED"}
  });
  if(expired.length){
    await prisma.professionalVerificationDocument.updateMany({
      where:{id:{in:expired.map(x=>x.id)}},data:{status:"EXPIRED"}
    });
    const accountIds=[...new Set(expired.map(x=>x.professionalAccountId))];
    await prisma.professionalAccount.updateMany({
      where:{id:{in:accountIds}},data:{verificationStatus:"EXPIRED"}
    });
  }
  return NextResponse.json({expiredDocuments:expired.length});
}
