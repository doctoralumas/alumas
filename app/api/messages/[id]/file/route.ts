import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {readPrivateFile} from '@/lib/storage';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u) return NextResponse.json({error:'Giriş gerekli'},{status:401});
  const {id}=await params;
  const row=await prisma.message.findUnique({where:{id}});
  
  if(!row||!row.attachmentPath) return NextResponse.json({error:'Dosya yok'},{status:404});
  if(row.senderId !== u.id && row.recipientId !== u.id) return NextResponse.json({error:'Erişim yok'},{status:403});
  
  const body=await readPrivateFile(row.attachmentPath);
  return new Response(body,{headers:{
    'Content-Type':row.mimeType||'application/octet-stream',
    'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(row.fileName||'dosya')}`,
    'Cache-Control':'private, max-age=86400'
  }});
}

