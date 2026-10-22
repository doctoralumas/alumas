import {NextResponse} from "next/server";import {currentUser} from "@/lib/auth";import {prisma} from "@/lib/prisma";
import { approvalBlockReason, withdrawExpiredCredentials } from "@/lib/verification-documents";
async function admin(){const u=await currentUser();return u?.role==="ADMIN"}
export async function GET(){if(!await admin())return NextResponse.json({error:"Yetkisiz"},{status:403});await withdrawExpiredCredentials();return NextResponse.json(await prisma.doctor.findMany({include:{user:{select:{email:true}},verificationDocuments:{orderBy:{createdAt:"desc"}}},orderBy:{createdAt:"desc"}}))}
export async function PATCH(req:Request){
  if(!await admin())return NextResponse.json({error:"Yetkisiz"},{status:403});
  const b=await req.json();
  if(!b.id)return NextResponse.json({error:"id gerekli"},{status:400});
  const approved=!!b.approved;
  const locale = req.headers.get("x-locale") || (req.headers.get("cookie")?.includes("NEXT_LOCALE=en") ? "en" : "tr");
  if(approved){
    const documents=await prisma.verificationDocument.findMany({where:{doctorId:String(b.id)}});
    const block=approvalBlockReason("doctor",null,documents,locale);
    if(block)return NextResponse.json({error:block, code:"REQUIRED_DOCUMENTS_MISSING"},{status:400});
  }
  return NextResponse.json(await prisma.doctor.update({
    where:{id:String(b.id)},
    data:{
      isVerified:approved,
      isPublished:approved,
      nextSlot:approved?(locale==="en"?"Check availability calendar":"Müsaitlik takvimine bakın"):(locale==="en"?"Post verification":"Doğrulama sonrası")
    }
  }));
}