import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

const num=(v:any)=>{if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
const norm=(s:string)=>s.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' ');

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:"Giriş gerekli"},{status:401});
  const {id}=await params;
  const row=await prisma.labResult.findUnique({where:{id}});
  if(!row||row.userId!==u.id)return NextResponse.json({error:"Bulunamadı"},{status:404});
  await prisma.labResult.delete({where:{id}});
  return NextResponse.json({ok:true});
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u) return NextResponse.json({error:"Giriş gerekli"},{status:401});
  const {id}=await params;
  const row=await prisma.labResult.findUnique({where:{id}});
  if(!row||row.userId!==u.id)return NextResponse.json({error:"Bulunamadı"},{status:404});

  const b=await req.json();
  const numericValue=num(b.numericValue??b.value),referenceLow=num(b.referenceLow),referenceHigh=num(b.referenceHigh);
  let status=String(b.status||'normal');
  if(numericValue!=null){
    if(referenceLow!=null&&numericValue<referenceLow)status='low';
    else if(referenceHigh!=null&&numericValue>referenceHigh)status='high';
    else if(referenceLow!=null||referenceHigh!=null)status='normal';
  }
  
  const updateData:any = {
    numericValue,
    referenceLow,
    referenceHigh,
    status
  };
  
  if (b.testName) {
    updateData.testName = String(b.testName).slice(0,120);
    updateData.normalizedName = norm(String(b.testName)).slice(0,120);
  }
  if (b.value !== undefined) updateData.value = String(b.value).slice(0,80);
  if (b.panel !== undefined) updateData.panel = b.panel?String(b.panel).slice(0,120):null;
  if (b.unit !== undefined) updateData.unit = b.unit?String(b.unit).slice(0,40):null;
  if (b.reference !== undefined) updateData.reference = b.reference?String(b.reference).slice(0,100):null;
  if (b.note !== undefined) updateData.note = b.note?String(b.note).slice(0,500):null;
  if (b.measuredAt) updateData.measuredAt = new Date(b.measuredAt);

  const updated = await prisma.labResult.update({where:{id}, data:updateData});
  return NextResponse.json(updated);
}
