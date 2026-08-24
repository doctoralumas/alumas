import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params; const doctor=await prisma.doctor.findUnique({where:{slug:id}}); if(!doctor)return NextResponse.json({error:"Uzman bulunamadı"},{status:404});
 const from=new Date(); const slots=await prisma.availability.findMany({where:{doctorId:doctor.id,isActive:true,startsAt:{gte:from}},orderBy:{startsAt:"asc"},take:40});
 const booked=await prisma.appointment.findMany({where:{doctorId:doctor.id,status:{not:"cancelled"},startsAt:{gte:from}},select:{startsAt:true}}); const busy=new Set(booked.map(b=>b.startsAt.toISOString()));
 return NextResponse.json(slots.filter(s=>!busy.has(s.startsAt.toISOString())).map(s=>({id:s.id,startsAt:s.startsAt.toISOString(),endsAt:s.endsAt.toISOString(),type:s.type})))}
