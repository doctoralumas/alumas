// @ts-nocheck
"use client";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkle, Stethoscope, MapPin, WarningCircle, ShieldCheck, PaperPlaneRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

function toUIMessages(raw: any[]) {
  return (raw || []).map((message, index) => {
    if (Array.isArray(message?.parts) && message.parts.length > 0) {
      return { id: String(message.id ?? index), role: message.role, parts: message.parts };
    }
    const parts: any[] = [];
    if (typeof message?.content === "string" && message.content) {
      parts.push({ type: "text", text: message.content });
    }
    const invocations = Array.isArray(message?.toolInvocations) ? message.toolInvocations : [];
    for (const invocation of invocations) {
      if (!invocation?.toolName) continue;
      parts.push({
        type: `tool-${invocation.toolName}`,
        toolCallId: String(invocation.toolCallId || `${message?.id}-${invocation.toolName}`),
        state: "output-available",
        input: invocation.input ?? invocation.args ?? {},
        output: invocation.output ?? invocation.result,
      });
    }
    if (!parts.length) parts.push({ type: "text", text: "" });
    return {
      id: String(message?.id ?? index),
      role: message?.role === "assistant" || message?.role === "system" ? message.role : "user",
      parts,
    };
  });
}

function messageText(message: any) {
  if (typeof message?.content === "string" && message.content) return message.content;
  if (!Array.isArray(message?.parts)) return "";
  return message.parts
    .filter((part: any) => part?.type === "text" && part.text)
    .map((part: any) => part.text)
    .join("");
}

function messageTools(message: any) {
  if (!Array.isArray(message?.parts)) return [];
  return message.parts.flatMap((part: any) => {
    const toolName = part?.type === "dynamic-tool"
      ? part.toolName
      : typeof part?.type === "string" && part.type.startsWith("tool-")
        ? part.type.slice(5)
        : null;
    if (!toolName) return [];
    return [{
      toolCallId: part.toolCallId || toolName,
      toolName,
      pending: part.state !== "output-available" && part.state !== "output-error",
      result: part.output,
    }];
  });
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const personalizeRef = useRef(personalize);
  personalizeRef.current = personalize;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: () => ({ personalize: personalizeRef.current }),
      }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    id: initialConversationId || undefined,
    messages: toUIMessages(initialMessages),
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || isLoading) return;
    sendMessage({ text: input });
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

        {messages.map((m: any) => {
          const text = messageText(m);
          const tools = messageTools(m);
          if (!text && tools.length === 0) return null;
          return (
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
               {text && (
                 <div className="ai-markdown" style={{ margin: 0, fontSize: "15px", lineHeight: "1.6" }}>
                   <ReactMarkdown
                     components={{
                       a: ({node, ...props}) => <a style={{color: '#2563eb', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '4px'}} {...props} />,
                          p: ({node, ...props}) => <p style={{margin: "0 0 12px 0", whiteSpace: "pre-wrap"}} {...props} />,
                       ul: ({node, ...props}) => <ul style={{margin: "0 0 12px 0", paddingLeft: "24px"}} {...props} />,
                       li: ({node, ...props}) => <li style={{marginBottom: "4px"}} {...props} />,
                       strong: ({node, ...props}) => <strong style={{fontWeight: 700}} {...props} />
                     }}
                   >
                     {text}
                   </ReactMarkdown>
                 </div>
               )}

               {tools.map((ti: any) => {
                  if (ti.pending) return <div key={ti.toolCallId} style={{ marginTop: text ? "12px" : "0", color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Sparkle className="spinner" size={14} color="#3b82f6" /> Luma araştırıyor...</div>;
                  
                  if (ti.toolName === 'find_doctors') {
                     const docs = ti.result;
                     if (!Array.isArray(docs)) return null;
                     return (
                        <div key={ti.toolCallId} style={{ marginTop: text ? "16px" : "0", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <strong style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", color: "#3b82f6" }}><Stethoscope size={16} /> Önerilen Uzmanlar</strong>
                          <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                            {docs.map((d: any) => (
                              <Link key={d.id} href={`/doctors/${d.slug}`} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", minWidth: compact ? "100%" : "240px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#3b82f6"} onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                 <div style={{ width: "40px", height: "40px", background: "#eff6ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: "bold", fontSize: "14px" }}>{String(d.name || "?").split(" ").filter(Boolean).slice(-2).map((x: string) => x[0]).join("").slice(0, 2)}</div>
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
                     const orgs = ti.result;
                     if (!Array.isArray(orgs)) return null;
                     return (
                        <div key={ti.toolCallId} style={{ marginTop: text ? "16px" : "0", display: "flex", flexDirection: "column", gap: "8px" }}>
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
          );
        })}

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
             disabled={isLoading || !input?.trim()}
             style={{ position: "absolute", right: "8px", width: "40px", height: "40px", borderRadius: "20px", background: input?.trim() ? "#0f172a" : "transparent", color: input?.trim() ? "#fff" : "#94a3b8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: input?.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
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

