import HealthNavigator from "@/components/ai/health-navigator";
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
      initialMessages = conv.messages.map(m => ({
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
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", display: "flex", gap: "32px", minHeight: "calc(100vh - 80px)", alignItems: "flex-start" }}>
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col gap-4 w-[280px] flex-shrink-0">
        <Link href="/ai" style={{ padding: "12px 16px", background: "#0f172a", color: "#fff", borderRadius: "12px", textDecoration: "none", fontWeight: 600, textAlign: "center" }}>
          + Yeni Sohbet
        </Link>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", padding: "8px 12px" }}>Geçmiş</div>
          {history.map(h => (
            <Link key={h.id} href={`/ai?c=${h.id}`} style={{ padding: "12px", borderRadius: "12px", background: q.c === h.id ? "#f1f5f9" : "transparent", color: q.c === h.id ? "#0f172a" : "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "12px", transition: "all 0.2s" }}>
              <ChatText size={18} weight={q.c === h.id ? "fill" : "regular"} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.title || "Yeni Sohbet"}</span>
            </Link>
          ))}
          {history.length === 0 && (
            <div style={{ padding: "12px", color: "#94a3b8", fontSize: "13px" }}>Henüz sohbet yok.</div>
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
        <HealthNavigator initialConversationId={q.c || null} initialMessages={initialMessages} />
      </div>
      
    </div>
  );
}
