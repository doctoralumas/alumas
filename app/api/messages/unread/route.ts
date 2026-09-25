import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ unreadCount: 0 });
  
  const unreadCount = await prisma.message.count({
    where: {
      recipientId: u.id,
      readAt: null
    }
  });

  return NextResponse.json({ unreadCount });
}
