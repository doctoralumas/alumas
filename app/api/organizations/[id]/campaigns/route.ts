import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

async function manage(id:string,u:any){return u?.role==='ADMIN'||!!(u&&await prisma.organization.findFirst({where:{id,ownerUserId:u.id}}))}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return NextResponse.json(await prisma.organizationCampaign.findMany({where:{organizationId:id},orderBy:{createdAt:'desc'}}))}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const u=await currentUser();if(!u)return NextResponse.json({error:'Giriş gerekli'},{status:401});const {id}=await params;if(!await manage(id,u))return NextResponse.json({error:'Yetki yok'},{status:403});const b=await req.json(),title=String(b.title||'').trim();if(!title)return NextResponse.json({error:'Başlık gerekli'},{status:400});return NextResponse.json(await prisma.organizationCampaign.create({data:{organizationId:id,title,description:b.description||null,imageUrl:b.imageUrl||null,startsAt:b.startsAt?new Date(b.startsAt):null,endsAt:b.endsAt?new Date(b.endsAt):null}}),{status:201})}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:'Giriş gerekli'},{status:401});
  const {id}=await params;
  if(!await manage(id,u))return NextResponse.json({error:'Yetki yok'},{status:403});
  const b=await req.json();
  if(!b.campaignId) return NextResponse.json({error:'Kampanya ID gerekli'},{status:400});
  
  const updateData: any = {};
  if(b.title !== undefined) updateData.title = String(b.title).trim();
  if(b.description !== undefined) updateData.description = b.description || null;
  if(b.startsAt !== undefined) updateData.startsAt = b.startsAt ? new Date(b.startsAt) : null;
  if(b.endsAt !== undefined) updateData.endsAt = b.endsAt ? new Date(b.endsAt) : null;
  if(b.isActive !== undefined) updateData.isActive = !!b.isActive;

  return NextResponse.json(await prisma.organizationCampaign.update({
    where: { id: b.campaignId, organizationId: id },
    data: updateData
  }));
}

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:'Giriş gerekli'},{status:401});
  const {id}=await params;
  if(!await manage(id,u))return NextResponse.json({error:'Yetki yok'},{status:403});
  
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if(!campaignId) return NextResponse.json({error:'Kampanya ID gerekli'},{status:400});

  await prisma.organizationCampaign.delete({
    where: { id: campaignId, organizationId: id }
  });
  return NextResponse.json({success:true});
}