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
      initialMessages = conv.messages.map((m: any) => {
        const parts: any[] = [];
        if (m.content) parts.push({ type: "text", text: m.content });
        let ui = m.uiState;
        if (typeof ui === "string") {
          try { ui = JSON.parse(ui); } catch { ui = null; }
        }
        if (Array.isArray(ui)) {
          for (const t of ui) {
            const toolName = t?.toolName;
            if (!toolName) continue;
            parts.push({
              type: `tool-${toolName}`,
              toolCallId: t.toolCallId || `${m.id}-${toolName}`,
              state: "output-available",
              input: t.input || t.args || {},
              output: t.output ?? t.result,
            });
          }
        }
        if (!parts.length) parts.push({ type: "text", text: m.content || "" });
        return { id: m.id, role: m.role, parts };
      });
    }
  }

  // Fetch recent conversations for sidebar
  const history = await prisma.aiConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body, html { overflow: hidden !important; }
        .legal-footer, .bottom-nav, .cookie-consent, .copilot-widget { display: none !important; }
        :root { --ai-top: 74px; }
        @media (max-width: 820px) { :root { --ai-top: 60px; } }
      `}} />
      <div style={{ position: "fixed", top: "var(--ai-top)", left: 0, right: 0, bottom: 0, backgroundColor: "#f8fafc", zIndex: 40, display: "flex", flexDirection: "column" }}>
         <AiLayout 
           history={history} 
           currentConversationId={q.c || null} 
           initialMessages={initialMessages} 
         />
      </div>
    </>
  );
}

