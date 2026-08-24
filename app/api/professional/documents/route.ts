import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getProfessionalAccountForUser } from "@/lib/professional/guards";
import { requiredDocsFor } from "@/lib/professional/document-requirements";

export async function POST(req:NextRequest){
  const user=await getSessionUser();
  if(!user) return NextResponse.json({error:"Oturum gerekli."},{status:401});
  const b=await req.json().catch(()=>({}));
  const account=await getProfessionalAccountForUser(user.id,String(b.accountId||""));
  if(!account) return NextResponse.json({error:"Profesyonel hesap bulunamadı."},{status:404});

  const allowed=requiredDocsFor(account.accountType as any).map(x=>x.type);
  if(!allowed.includes(b.documentType)) return NextResponse.json({error:"Bu hesap türü için geçersiz belge tipi."},{status:400});
  if(!String(b.fileStorageKey||"").trim()) return NextResponse.json({error:"Özel depolama anahtarı zorunludur."},{status:400});

  const doc=await prisma.professionalVerificationDocument.create({
    data:{
      professionalAccountId:account.id,
      documentType:b.documentType,
      documentNumber:b.documentNumber||null,
      issuer:b.issuer||null,
      issuedAt:b.issuedAt?new Date(b.issuedAt):null,
      expiresAt:b.expiresAt?new Date(b.expiresAt):null,
      fileStorageKey:b.fileStorageKey,
      fileName:b.fileName||null,
      mimeType:b.mimeType||null,
      status:"PENDING"
    }
  });
  await prisma.professionalAccount.update({where:{id:account.id},data:{verificationStatus:"PENDING"}});
  return NextResponse.json({document:doc});
}
