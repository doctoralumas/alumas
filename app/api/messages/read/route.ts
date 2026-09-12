import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function PATCH(req:Request){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:"Giriş gerekli"},{status:401});
  const b=await req.json();
  if(!b.senderId)return NextResponse.json({error:"Eksik gönderici bilgisi"},{status:400});
  
  // Mark all unread messages from this sender to the current user as read
  await prisma.message.updateMany({
    where: {
      senderId: b.senderId,
      recipientId: u.id,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  return NextResponse.json({success:true});
}

