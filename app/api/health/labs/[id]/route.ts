import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:"Giriş gerekli"},{status:401});
  const {id}=await params;
  const row=await prisma.labResult.findUnique({where:{id}});
  if(!row||row.userId!==u.id)return NextResponse.json({error:"Bulunamadı"},{status:404});
  await prisma.labResult.delete({where:{id}});
  return NextResponse.json({ok:true});
}
