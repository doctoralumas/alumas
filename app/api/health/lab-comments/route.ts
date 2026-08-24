import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

async function doctorCanSee(patientId:string,doctorId:string){
  const [consent,share,appointment]=await Promise.all([
    prisma.healthShareConsent.findUnique({where:{patientId_doctorId:{patientId,doctorId}}}),
    prisma.healthReportShare.findFirst({where:{patientId,doctorId,status:'active',OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]}}),
    prisma.appointment.findFirst({where:{userId:patientId,doctorId}})
  ]);
  return Boolean(appointment && ((consent?.status==='active'&&consent.scopes.includes('labs'))||share));
}

export async function GET(req:Request){
  const u=await currentUser();if(!u)return NextResponse.json({error:'Giriş gerekli'},{status:401});
  const url=new URL(req.url);
  if(u.role==='PATIENT'){
    return NextResponse.json(await prisma.labResultComment.findMany({where:{patientId:u.id,patientVisible:true},include:{doctor:{select:{name:true}},labResult:{select:{testName:true,value:true,unit:true,measuredAt:true}}},orderBy:{createdAt:'desc'}}));
  }
  if(u.role==='DOCTOR'&&u.doctorProfile){
    const patientId=String(url.searchParams.get('patientId')||'');
    if(!patientId||!(await doctorCanSee(patientId,u.doctorProfile.id)))return NextResponse.json({error:'Erişim yok'},{status:403});
    return NextResponse.json(await prisma.labResultComment.findMany({where:{patientId,doctorId:u.doctorProfile.id},include:{labResult:{select:{testName:true,value:true,unit:true,measuredAt:true}}},orderBy:{createdAt:'desc'}}));
  }
  return NextResponse.json({error:'Erişim yok'},{status:403});
}

export async function POST(req:Request){
  const u=await currentUser();if(!u||u.role!=='DOCTOR'||!u.doctorProfile)return NextResponse.json({error:'Doktor hesabı gerekli'},{status:403});
  const b=await req.json();const patientId=String(b.patientId||''),labResultId=String(b.labResultId||''),body=String(b.body||'').trim();
  if(!patientId||!labResultId||!body)return NextResponse.json({error:'Hasta, sonuç ve yorum gerekli'},{status:400});
  if(!(await doctorCanSee(patientId,u.doctorProfile.id)))return NextResponse.json({error:'Laboratuvar verisine erişim izni yok'},{status:403});
  const lab=await prisma.labResult.findFirst({where:{id:labResultId,userId:patientId}});if(!lab)return NextResponse.json({error:'Laboratuvar sonucu bulunamadı'},{status:404});
  const row=await prisma.labResultComment.create({data:{labResultId,patientId,doctorId:u.doctorProfile.id,body:body.slice(0,1500),patientVisible:b.patientVisible!==false}});
  if(row.patientVisible)await prisma.notification.create({data:{userId:patientId,title:'Laboratuvar sonucuna doktor yorumu',body:`${u.doctorProfile.name}, ${lab.testName} sonucuna bir yorum ekledi.`,kind:'lab_comment'}});
  return NextResponse.json(row,{status:201});
}
