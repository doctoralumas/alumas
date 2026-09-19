// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkle, User, Stethoscope, MapPin, ArrowRight, WarningCircle, ShieldCheck, CheckCircle, PaperPlaneRight } from "@phosphor-icons/react";
import Link from "next/link";

function useCustomChat({ api, initialConversationId, initialMessages, body, onResponse }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const append = async (msg) => {
    const newMessages = [...messages, { ...msg, id: Date.now().toString() }];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          ...body
        })
      });
      
      if (onResponse) onResponse(res);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantContent = "";
      let toolInvocations = [];
      const assistantId = Date.now().toString();
      
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", toolInvocations: [] }]);
      
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          try {
            if (trimmed.startsWith('0:')) {
              const text = JSON.parse(trimmed.substring(2));
              assistantContent += text;
              setMessages(prev => prev.map(p => p.id === assistantId ? { ...p, content: assistantContent } : p));
            }
            else if (trimmed.startsWith('9:')) {
              const toolCall = JSON.parse(trimmed.substring(2));
              toolInvocations.push({ state: 'call', toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, args: toolCall.args });
              setMessages(prev => prev.map(p => p.id === assistantId ? { ...p, toolInvocations: [...toolInvocations] } : p));
            }
            else if (trimmed.startsWith('a:')) {
              const toolResult = JSON.parse(trimmed.substring(2));
              const idx = toolInvocations.findIndex(t => t.toolCallId === toolResult.toolCallId);
              if (idx >= 0) {
                 toolInvocations[idx] = { ...toolInvocations[idx], state: 'result', result: toolResult.result };
                 setMessages(prev => prev.map(p => p.id === assistantId ? { ...p, toolInvocations: [...toolInvocations] } : p));
              }
            }
          } catch (err) {
            console.error("Failed to parse stream chunk:", trimmed, err);
          }
        }
      }
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { messages, append, isLoading, error };
}

export default function HealthNavigator({ 
  compact = false,
  initialConversationId = null,
  initialMessages = []
}: { 
  compact?: boolean;
  initialConversationId?: string | null;
  initialMessages?: any[];
}) {
  const [personalize, setPersonalize] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { messages, append, isLoading, error } = useCustomChat({
    api: "/api/ai/chat",
    initialConversationId,
    initialMessages,
    body: { id: conversationId, personalize },
    onResponse: (response) => {
      const convId = response.headers.get("x-conversation-id");
      if (convId) setConversationId(convId);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    append({ role: 'user', content: input });
    setInput("");
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: compact ? "100%" : "calc(100vh - 180px)", width: "100%", position: "relative" }}>
      
      {/* Messages Area */}
      <div ref={chatContainerRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", height: "100%", padding: "20px" }}>
             <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: "20px", boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}>
              <Sparkle size={32} weight="fill" />
            </div>
            <h1 style={{ fontSize: "24px", color: "#0f172a", margin: "0 0 12px 0", fontWeight: 800 }}>Ben Luma. Nasıl yardımcı olabilirim?</h1>
            <p style={{ margin: 0, fontSize: "15px", color: "#64748b", maxWidth: "400px" }}>
              Şikayetinizi yazın, sizi en doğru uzman veya kuruma yönlendireyim.
            </p>
          </div>
        )}

        {messages.map((m: any) => (
          <div key={m.id} style={{ display: "flex", gap: "16px", alignSelf: m.role === 'user' ? "flex-end" : "flex-start", maxWidth: m.role === 'user' ? "85%" : "100%" }}>
            
            {m.role === 'assistant' && (
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <Sparkle size={18} weight="fill" />
              </div>
            )}
            
            <div style={{ 
              background: m.role === 'user' ? "#0f172a" : "#f8fafc", 
              color: m.role === 'user' ? "#fff" : "#0f172a",
              padding: "16px", 
              borderRadius: "20px", 
              border: m.role === 'user' ? "none" : "1px solid #e2e8f0",
              borderTopRightRadius: m.role === 'user' ? "4px" : "20px",
              borderTopLeftRadius: m.role === 'assistant' ? "4px" : "20px",
              boxShadow: m.role === 'user' ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
            }}>
               {m.content && (
                 <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                   {m.content}
                 </p>
               )}

               {/* Render rich UI if the assistant called tools */}
               {m.toolInvocations?.map((ti: any) => {
                  if (ti.state !== 'result') return <div key={ti.toolCallId} style={{ marginTop: m.content ? "12px" : "0", color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Sparkle className="spinner" size={14} color="#3b82f6" /> Luma araştırıyor...</div>;
                  
                  if (ti.toolName === 'find_doctors') {
                     const docs = ti.result as any[];
                     if (docs.error) return null;
                     return (
                        <div key={ti.toolCallId} style={{ marginTop: m.content ? "16px" : "0", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <strong style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", color: "#3b82f6" }}><Stethoscope size={16} /> Önerilen Uzmanlar</strong>
                          <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                            {docs.map((d: any) => (
                              <Link key={d.id} href={`/doctors/${d.slug}`} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", minWidth: compact ? "100%" : "240px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#3b82f6"} onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                 <div style={{ width: "40px", height: "40px", background: "#eff6ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: "bold", fontSize: "14px" }}>{d.name.split(" ").slice(-2).map((x: string) => x[0]).join("").slice(0, 2)}</div>
                                 <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                                    <div style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.specialty}</div>
                                 </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                     )
                  }

                  if (ti.toolName === 'find_organizations') {
                     const orgs = ti.result as any[];
                     if (orgs.error) return null;
                     return (
                        <div key={ti.toolCallId} style={{ marginTop: m.content ? "16px" : "0", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <strong style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", color: "#10b981" }}><MapPin size={16} /> Uygun Kurumlar</strong>
                          <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                            {orgs.map((o: any) => (
                              <Link key={o.id} href={`/organizations/${o.slug}`} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", minWidth: compact ? "100%" : "220px", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#10b981"} onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                 <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</div>
                                 <div style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.city} {o.isOnDuty ? "• Nöbetçi" : ""}</div>
                              </Link>
                            ))}
                          </div>
                        </div>
                     )
                  }
                  return null;
               })}
            </div>
          </div>
        ))}

        {error && (
           <div style={{ alignSelf: "center", background: "#fef2f2", color: "#ef4444", padding: "12px 20px", borderRadius: "12px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
             <WarningCircle size={18} weight="bold" /> Yanıt alınamadı.
           </div>
        )}
      </div>

      {/* Input Area (Sticky at bottom) */}
      <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #e2e8f0", zIndex: 10 }}>
         <form onSubmit={handleSubmit} style={{ position: "relative", display: "flex", alignItems: "center" }}>
           <input 
             value={input}
             onChange={e => setInput(e.target.value)}
             placeholder="Mesajınızı Luma'ya iletin..."
             disabled={isLoading}
             style={{ width: "100%", background: "#f1f5f9", border: "1px solid transparent", borderRadius: "100px", padding: "16px 60px 16px 24px", fontSize: "15px", outline: "none", color: "#0f172a", transition: "all 0.2s" }}
             onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "0 0 0 4px #f1f5f9"; }}
             onBlur={e => { e.target.style.background = "#f1f5f9"; e.target.style.borderColor = "transparent"; e.target.style.boxShadow = "none"; }}
           />
           <button 
             type="submit" 
             disabled={isLoading || !input.trim()}
             style={{ position: "absolute", right: "8px", width: "40px", height: "40px", borderRadius: "20px", background: input.trim() ? "#0f172a" : "transparent", color: input.trim() ? "#fff" : "#94a3b8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
           >
             {isLoading ? <div className="spinner" style={{ width: "18px", height: "18px", border: "2px solid rgba(15,23,42,0.2)", borderTopColor: "#0f172a", borderRadius: "50%" }} /> : <PaperPlaneRight size={20} weight="fill" />}
           </button>
         </form>
         
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", padding: "0 8px" }}>
           <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: personalize ? "#0ea5e9" : "#64748b", cursor: "pointer" }}>
              <input type="checkbox" checked={personalize} onChange={e => setPersonalize(e.target.checked)} style={{ accentColor: "#0ea5e9", cursor: "pointer", width: "14px", height: "14px" }} />
              Sağlık profilimi kullan
           </label>
           <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}><ShieldCheck size={14} /> Şifreli Bağlantı</span>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
}
