"use client";
import {useEffect,useMemo,useState,useRef,Suspense} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import {Check, CheckCheck, Paperclip, FileText} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type Contact={id:string;name:string;subtitle:string;lastMessageAt:string};
type Msg={id:string;body:string;createdAt:string;readAt:string|null;senderId:string;recipientId:string;mine:boolean;senderName:string;attachmentPath:string|null;fileName:string|null;mimeType:string|null};

function MessagesContent(){
  const searchParams=useSearchParams();
  const router=useRouter();
  const initialUserId=searchParams.get("userId");
  
  const [contacts,setContacts]=useState<Contact[]>([]);
  const [messages,setMessages]=useState<Msg[]>([]);
  const [active,setActive]=useState(initialUserId||"");
  const [body,setBody]=useState("");
  const [uploading, setUploading] = useState(false);
  
  const activeRef = useRef(active);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(()=>{activeRef.current=active;},[active]);

  const load=async(forceUserId?:string)=>{
    const qs=forceUserId?`?userId=${forceUserId}`:'';
    const r=await fetch('/api/messages'+qs);
    if(r.ok){
      const x=await r.json();
      setContacts(x.contacts||[]);
      setMessages(x.messages||[]);
      
      // Keep track of our own ID to configure Supabase filters correctly
      if(x.messages.length > 0) {
         const myMsg = x.messages.find((m: Msg) => m.mine);
         if(myMsg) currentUserIdRef.current = myMsg.senderId;
         else currentUserIdRef.current = x.messages.find((m: Msg) => !m.mine)?.recipientId || null;
      }

      if(!activeRef.current && x.contacts?.[0] && !forceUserId){
        setActive(x.contacts[0].id);
      }
    }
  };

  useEffect(()=>{
    let channel: any;
    let fallbackInterval: any;

    async function setupRealtime() {
      try {
        // 1. Fetch custom JWT (Bridge between NextAuth and Supabase)
        const r = await fetch('/api/auth/realtime');
        if (!r.ok) throw new Error("JWT fetch failed");
        
        const { token } = await r.json();
        
        // 2. Authenticate the WebSocket connection securely
        supabase.realtime.setAuth(token);

        // 3. Subscribe to the Message table
        // Thanks to the RLS policy we injected, Supabase will only broadcast messages belonging to this user!
        channel = supabase
          .channel('secure_messages')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Message' },
            () => {
              load(initialUserId||undefined);
            }
          )
          .subscribe();
      } catch (e) {
        console.warn("Realtime failed, falling back to polling", e);
        fallbackInterval = setInterval(() => load(initialUserId||undefined), 10000);
      }
    }
    
    load(initialUserId||undefined);
    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  },[initialUserId]);

  useEffect(()=>{
    if(active){
      fetch('/api/messages/read',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({senderId:active})
      }).catch(()=>{});
    }
  },[active, messages.length]);

  const thread=useMemo(()=>messages.filter(m=>m.senderId===active||m.recipientId===active),[messages,active]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if(!file || !active) return;
    
    setUploading(true);
    try {
      // 1. Get R2 presigned URL
      const presignRes = await fetch('/api/health/imaging/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size })
      });
      if(!presignRes.ok) throw new Error("Yükleme adresi alınamadı");
      const { presignedUrl, storagePath } = await presignRes.json();
      
      // 2. Upload directly to Cloudflare R2
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' }
      });
      if(!uploadRes.ok) throw new Error("Dosya yüklenemedi");
      
      // 3. Send message with attachment
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: active,
          body: '',
          attachmentPath: storagePath,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream'
        })
      });
      load(initialUserId||undefined);
    } catch (err: any) {
      alert(err.message || 'Yükleme hatası');
    } finally {
      setUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function send(e:React.FormEvent){
    e.preventDefault();
    if(!active||!body.trim())return;
    const currentBody = body;
    setBody(''); // Optimistic clear
    const r=await fetch('/api/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({recipientId:active,body:currentBody})
    });
    if(!r.ok){
       setBody(currentBody); // Revert on failure
       alert("Mesaj gönderilemedi");
    } else {
       load(initialUserId||undefined);
    }
  }

  const unreadCounts = useMemo(()=>{
    const counts:Record<string,number>={};
    messages.forEach(m=>{
      if(!m.mine && !m.readAt){
        counts[m.senderId] = (counts[m.senderId]||0) + 1;
      }
    });
    return counts;
  },[messages]);

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">İletişim</span>
        <h1>Mesajlar</h1>
        <p>Sağlık ağındaki tüm kişilerle uygulama içi güvenli iletişim kur.</p>
      </div>
      
      <div className="message-layout">
        <aside className="contact-list">
          {contacts.map(c=>(
            <button key={c.id} onClick={()=>setActive(c.id)} className={active===c.id?'contact active-contact':'contact'}>
              <div>
                <b>{c.name}</b>
                <span>{c.subtitle}</span>
              </div>
              {unreadCounts[c.id] > 0 && <span className="unread-badge">{unreadCounts[c.id]}</span>}
            </button>
          ))}
          {!contacts.length&&<div className="empty">Gelen kutusu boş.</div>}
        </aside>
        
        <section className="chat-panel">
          <div className="chat-head">
            <div className="avatar mini">{contacts.find(c=>c.id===active)?.name?.slice(0,2)||"AL"}</div>
            <div>
              <b>{contacts.find(c=>c.id===active)?.name||"Sohbet Seçin"}</b>
              <span>{contacts.find(c=>c.id===active)?.subtitle||"Güvenli iletişim"}</span>
            </div>
          </div>
          
          <div className="chat-stream">
            {thread.map(m=>(
              <div key={m.id} className={m.mine?'bubble mine':'bubble'}>
                <b>{m.mine?'Sen':m.senderName}</b>
                {m.body && <p>{m.body}</p>}
                
                {m.attachmentPath && (
                  <div className="message-attachment" style={{marginTop: '6px', marginBottom: '4px'}}>
                    {m.mimeType?.startsWith('image/') ? (
                      <a href={`/api/messages/${m.id}/file`} target="_blank" rel="noopener noreferrer">
                        <img src={`/api/messages/${m.id}/file`} alt={m.fileName||'Ek'} style={{maxWidth: '220px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)'}} />
                      </a>
                    ) : (
                      <a href={`/api/messages/${m.id}/file`} target="_blank" rel="noopener noreferrer" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: m.mine ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '8px', textDecoration: 'none', color: 'inherit'}}>
                        <FileText size={20} />
                        <span style={{fontSize: '13px', wordBreak: 'break-all'}}>{m.fileName}</span>
                      </a>
                    )}
                  </div>
                )}
                
                <div className="bubble-meta">
                  <small>{new Date(m.createdAt).toLocaleString('tr-TR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'})}</small>
                  {m.mine && (
                    <span className="read-receipt">
                      {m.readAt ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {!thread.length&&active&&<div className="empty">Konuşmayı başlatmak için bir mesaj yaz.</div>}
            {!active&&<div className="empty">Sol menüden bir kişi seçin.</div>}
          </div>
          
          {active && (
            <form className="chat-form" onSubmit={send} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileUpload} accept="image/*,application/pdf" />
              <button 
                type="button" 
                className="icon-button" 
                onClick={()=>fileInputRef.current?.click()} 
                disabled={uploading}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--primary)' }}
                title="Dosya veya Resim Yükle"
              >
                <Paperclip size={24} />
              </button>
              
              <input 
                value={body} 
                onChange={e=>setBody(e.target.value)} 
                placeholder={uploading ? "Dosya yükleniyor..." : "Mesajını yaz..."} 
                disabled={uploading} 
                style={{flex: 1, padding: '12px', borderRadius: '20px', border: '1px solid var(--border)'}}
              />
              <button className="primary" disabled={(!body.trim() && !uploading) || uploading} style={{borderRadius: '20px', padding: '10px 20px'}}>Gönder</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Messages(){
  return (
    <Suspense fallback={<div className="page empty">Mesajlar yükleniyor...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
