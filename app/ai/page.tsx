import AiLayout from "@/components/ai/ai-layout";
import Link from "next/link";
import { ShieldCheck, ChatText } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AiPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/ai");
  
  const q = await searchParams;
  let initialMessages: any[] = [];
  
  if (q.c) {
    const conv = await prisma.aiConversation.findFirst({
      where: { id: q.c, userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (conv) {
      initialMessages = conv.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolInvocations: m.uiState ? (typeof m.uiState === 'string' ? JSON.parse(m.uiState) : m.uiState) : undefined
      }));
    }
  }

  // Fetch recent conversations for sidebar
  const history = await prisma.aiConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });

  return (
    <div style={{ width: "100%", backgroundColor: "#f8fafc" }}>
       <AiLayout 
         history={history} 
         currentConversationId={q.c || null} 
         initialMessages={initialMessages} 
       />
    </div>
  );
}
