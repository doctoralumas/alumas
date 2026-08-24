import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";import {notifyUser} from "@/lib/fcm";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await currentUser(); if(!user)return NextResponse.json({error:"Giriş gerekli"},{status:401});
 const {id}=await params; const body=await req.json();
 const apt=await prisma.appointment.findUnique({where:{id},include:{doctor:true}}); if(!apt)return NextResponse.json({error:"Randevu bulunamadı"},{status:404});
 const allowed=user.role==="ADMIN"||apt.userId===user.id||(user.role==="DOCTOR"&&user.doctorProfile?.id===apt.doctorId); if(!allowed)return NextResponse.json({error:"Yetkisiz"},{status:403});
 if(body.action==="cancel"){
  const row=await prisma.appointment.update({where:{id},data:{status:"cancelled"}});
  await notifyUser(apt.userId,"Randevu iptal edildi",`${apt.doctor.name} randevunuz iptal edildi.`,"appointment",{appointmentId:apt.id}).catch(()=>{});
  return NextResponse.json(row);
 }
 if(body.action==="complete"){
  if(user.role!=="ADMIN"&&!(user.role==="DOCTOR"&&user.doctorProfile?.id===apt.doctorId))return NextResponse.json({error:"Görüşmeyi yalnızca uzman veya admin tamamlayabilir."},{status:403});
  const now=new Date();const row=await prisma.appointment.update({where:{id},data:{status:"completed",reviewRequestedAt:apt.reviewRequestedAt||now}});
  if(!apt.reviewRequestedAt)await notifyUser(apt.userId,"Görüşmeni değerlendir",`${apt.doctor.name} ile görüşmen tamamlandı. Deneyimini Alumas'ta paylaşabilirsin.`,"review_request",{appointmentId:apt.id,doctorId:apt.doctor.slug}).catch(()=>{});
  return NextResponse.json(row);
 }
 if(body.action==="reschedule"){
  if(apt.userId!==user.id&&user.role!=="ADMIN")return NextResponse.json({error:"Ertelemeyi hasta veya admin yapabilir."},{status:403});
  const startsAt=new Date(body.startsAt); const slot=await prisma.availability.findUnique({where:{doctorId_startsAt:{doctorId:apt.doctorId,startsAt}}});
  if(!slot||!slot.isActive)return NextResponse.json({error:"Yeni saat müsait değil."},{status:409});
  try{const busy=await prisma.appointment.findFirst({where:{doctorId:apt.doctorId,startsAt,status:{not:"cancelled"},id:{not:id}}});if(busy)return NextResponse.json({error:"Bu saat artık dolu."},{status:409});const row=await prisma.appointment.update({where:{id},data:{startsAt,status:"confirmed"}}); await notifyUser(apt.userId,"Randevu ertelendi",`Yeni saat: ${startsAt.toLocaleString("tr-TR")}`,"appointment",{appointmentId:apt.id}).catch(()=>{}); return NextResponse.json(row)}catch{return NextResponse.json({error:"Bu saat artık dolu."},{status:409})}
 }
 return NextResponse.json({error:"Geçersiz işlem"},{status:400});
}
