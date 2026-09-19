import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch a specific conversation and its messages
      const conv = await prisma.aiConversation.findFirst({
        where: { id, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(conv);
    }

    // Fetch list of conversations
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      take: 20
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("AI Conversations Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.aiConversation.deleteMany({
      where: { id, userId: user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
