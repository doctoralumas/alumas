"use client";
import {useEffect,useState,useRef,useMemo,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {Paperclip, FileText, Check, Checks, PaperPlaneRight, Image as ImageIcon, ChatsCircle, MagnifyingGlass, CaretLeft} from "@phosphor-icons/react";
import Link from "next/link";
import SectionVisual from "@/components/section-visual";

type Message={id:string;senderId:string;recipientId:string;body:string;senderName:string;createdAt:string;readAt:string|null;mine:boolean;attachmentPath?:string;fileName?:string;mimeType?:string};
type Contact={id:string;name:string;subtitle:string};

function MessagesContent(){
  const sp=useSearchParams(), initialUserId=sp.get('userId');
  const [messages,setMessages]=useState<Message[]>([]);
  const [contacts,setContacts]=useState<Contact[]>([]);
  const [active,setActive]=useState<string>(initialUserId||'');
  const [body,setBody]=useState('');
  const [uploading,setUploading]=useState(false);
  const messagesEndRef=useRef<HTMLDivElement>(null);
  const fileInputRef=useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load=async(forceActive?:string)=>{
    const r=await fetch('/api/messages' + (forceActive ? `?userId=${forceActive}` : ''));
    if(!r.ok)return;
    const {contacts: apiContacts, messages: apiMessages} = await r.json();
    setMessages(apiMessages || []);
    setContacts(apiContacts || []);
    
    if(forceActive) setActive(forceActive);
    else if(!active && apiContacts?.length > 0){
      setActive(initialUserId || apiContacts[0].id);
    }
  };
  
  useEffect(()=>{load(initialUserId||undefined)},[initialUserId]);
  
  useEffect(()=>{
    if(active){
      fetch('/api/messages/read',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:active})}).then(()=>load());
    }
  },[active]);
  
  const thread=useMemo(()=>messages.filter(m=>(m.senderId===active&&!m.mine)||(m.recipientId===active&&m.mine)).sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()),[messages,active]);
  
  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:'smooth'}) },[thread]);

  async function handleFileUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if(!file||!active)return;
    if(file.size > 5 * 1024 * 1024){ alert('Dosya boyutu en fazla 5MB olabilir.'); return; }
    
    setUploading(true);
    try {
      const presignRes = await fetch('/api/messages/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size })
      });
      if(!presignRes.ok) throw new Error("Yükleme adresi alınamadı");
      const { presignedUrl, storagePath } = await presignRes.json();
      
      const uploadRes = await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      if(!uploadRes.ok) throw new Error("Dosya yüklenemedi");
      
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: active, body: '', attachmentPath: storagePath, fileName: file.name, mimeType: file.type || 'application/octet-stream' })
      });
      load(initialUserId||undefined);
    } catch (err: any) { alert(err.message || 'Yükleme hatası'); } 
    finally { setUploading(false); if(fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function send(e:React.FormEvent){
    e.preventDefault();
    if(!active||!body.trim())return;
    const currentBody = body;
    setBody(''); 
    const r=await fetch('/api/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recipientId:active,body:currentBody})
    });
    if(!r.ok){ setBody(currentBody); alert("Mesaj gönderilemedi"); } 
    else { load(initialUserId||undefined); }
  }

  const unreadCounts = useMemo(()=>{
    const counts:Record<string,number>={};
    messages.forEach(m=>{ if(!m.mine && !m.readAt) counts[m.senderId] = (counts[m.senderId]||0) + 1; });
    return counts;
  },[messages]);

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <div style={{ marginBottom: "24px", padding: "32px", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 600, marginBottom: "20px", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#3b82f6"} onMouseOut={e=>e.currentTarget.style.color="#64748b"}>
          <CaretLeft size={16} weight="bold" /> Tüm Hizmetlere Dön
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker" style={{ background: "#dbeafe", color: "#1d4ed8", padding: "6px 12px", borderRadius: "100px", fontWeight: 800, fontSize: "11px", letterSpacing: "0.5px" }}>GÜVENLİ İLETİŞİM KANALI</span>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "16px 0 8px 0", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "12px" }}>
              Mesajlar
            </h1>
            <p style={{ color: "#475569", margin: 0, fontSize: "15px" }}>Sağlık profesyonelleri ve kurumlarla güvenli bir şekilde iletişim kurun.</p>
          </div>
        </div>
      </div>
      
      <div className="messages-layout">
        
        {/* Sol Panel: Kişiler */}
        <aside className={`contact-list ${active ? 'mobile-hidden' : ''}`} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ position: "relative" }}>
              <MagnifyingGlass size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input 
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Kişi ara..." 
                style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#f8fafc", color: "#0f172a" }} 
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {filteredContacts.map(c=>(
              <button 
                key={c.id} 
                onClick={()=>setActive(c.id)} 
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: active===c.id ? "#f0f9ff" : "transparent", cursor: "pointer", textAlign: "left", transition: "all 0.2s", marginBottom: "4px" }}
                className={active!==c.id ? "hover-bg-slate" : ""}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: active===c.id ? "#0284c7" : "#e2e8f0", color: active===c.id ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600 }}>
                    {c.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "15px", color: active===c.id ? "#0369a1" : "#0f172a", marginBottom: "2px" }}>{c.name}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{c.subtitle}</span>
                  </div>
                </div>
                {unreadCounts[c.id] > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px" }}>{unreadCounts[c.id]}</span>
                )}
              </button>
            ))}
            {!filteredContacts.length && (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                <ChatsCircle size={32} weight="duotone" style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                Görüşme bulunamadı.
              </div>
            )}
          </div>
        </aside>
        
        {/* Sağ Panel: Sohbet Alanı */}
        <section className={`chat-area ${!active ? 'mobile-hidden' : ''}`} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
          {active ? (
            <>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px", background: "#f8fafc" }}>
                <button className="mobile-back-btn" onClick={() => setActive('')} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", padding: 0 }}><CaretLeft size={24} weight="bold" /></button>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600 }}>
                  {contacts.find(c=>c.id===active)?.name?.substring(0,2).toUpperCase() || "AL"}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "18px", color: "#0f172a" }}>{contacts.find(c=>c.id===active)?.name || "Sohbet"}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Güvenli İletişim Kanalı</span>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", background: "#f1f5f9" }}>
                {thread.map(m=>(
                  <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                    <div style={{ background: m.mine ? "#0284c7" : "#fff", color: m.mine ? "#fff" : "#0f172a", padding: "16px", borderRadius: "20px", borderBottomRightRadius: m.mine ? "4px" : "20px", borderBottomLeftRadius: m.mine ? "20px" : "4px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
                      {m.body && <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.5" }}>{m.body}</p>}
                      
                      {m.attachmentPath && (
                        <div style={{ marginTop: m.body ? "12px" : "0" }}>
                          {m.mimeType?.startsWith('image/') ? (
                            <a href={`/api/messages/${m.id}/file`} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "12px", overflow: "hidden" }}>
                              <img src={`/api/messages/${m.id}/file`} alt={m.fileName||'Ek'} style={{ maxWidth: '100%', maxHeight: "250px", display: "block", objectFit: "cover" }} />
                            </a>
                          ) : (
                            <a href={`/api/messages/${m.id}/file`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: m.mine ? 'rgba(255,255,255,0.2)' : '#f1f5f9', padding: '12px', borderRadius: '12px', textDecoration: 'none', color: 'inherit' }}>
                              <FileText size={24} weight="duotone" />
                              <span style={{ fontSize: '14px', fontWeight: 500, wordBreak: 'break-all' }}>{m.fileName}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: m.mine ? "flex-end" : "flex-start", gap: "6px", marginTop: "6px", padding: "0 4px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>{new Date(m.createdAt).toLocaleString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</span>
                      {m.mine && (
                        <span style={{ color: m.readAt ? "#3b82f6" : "#cbd5e1" }}>
                          {m.readAt ? <Checks size={14} weight="bold" /> : <Check size={14} weight="bold" />}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {!thread.length && (
                  <div style={{ margin: "auto", textAlign: "center", padding: "24px", background: "rgba(255,255,255,0.6)", borderRadius: "16px", color: "#64748b" }}>
                    Bu kişiyle henüz bir görüşmeniz yok.<br/>Mesaj yazarak sohbeti başlatabilirsiniz.
                  </div>
                )}
              </div>
              
              <div style={{ padding: "16px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
                <form onSubmit={send} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileUpload} accept="image/*,application/pdf" />
                  <button 
                    type="button" 
                    onClick={()=>fileInputRef.current?.click()} 
                    disabled={uploading}
                    style={{ flexShrink: 0, background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '12px', borderRadius: '50%', color: '#64748b', display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                    title="Dosya veya Resim Yükle"
                  >
                    <Paperclip size={24} weight="bold" />
                  </button>
                  
                  <input 
                    value={body} 
                    onChange={e=>setBody(e.target.value)} 
                    placeholder={uploading ? "Dosya yükleniyor..." : "Mesajınızı yazın..."} 
                    disabled={uploading} 
                    style={{ flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: '100px', border: '1px solid #cbd5e1', fontSize: "15px", background: "#f8fafc", outline: "none" }}
                  />
                  
                  <button 
                    className="primary" 
                    disabled={(!body.trim() && !uploading) || uploading} 
                    style={{ flexShrink: 0, borderRadius: '50%', width: "48px", height: "48px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: (!body.trim() && !uploading) ? 0.5 : 1 }}
                  >
                    <PaperPlaneRight size={24} weight="fill" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "#f8fafc", color: "#94a3b8" }}>
              <ChatsCircle size={64} weight="duotone" style={{ marginBottom: "16px", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 8px 0", color: "#64748b" }}>Mesajlaşma</h3>
              <p style={{ margin: 0, fontSize: "14px" }}>Soldaki listeden bir kişi seçerek sohbeti başlatın.</p>
            </div>
          )}
        </section>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-slate:hover { background: #f8fafc !important; }
        .messages-layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; height: calc(100vh - 280px); min-height: 600px; }
        @media (max-width: 768px) {
          .messages-layout { grid-template-columns: 1fr; height: calc(100vh - 200px); }
          .mobile-hidden { display: none !important; }
          .mobile-back-btn { display: flex !important; }
          .chat-area { border-radius: 16px; }
          .contact-list { border-radius: 16px; }
        }
      `}}/>
    </div>
  );
}

export default function Messages(){
  return (
    <Suspense fallback={<div style={{padding: "40px", textAlign: "center", color: "#64748b"}}>Mesajlar yükleniyor...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
