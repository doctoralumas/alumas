"use client";
import {useEffect,useMemo,useState,useRef,Suspense} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import {Check, CheckCheck} from "lucide-react";

type Contact={id:string;name:string;subtitle:string;lastMessageAt:string};
type Msg={id:string;body:string;createdAt:string;readAt:string|null;senderId:string;recipientId:string;mine:boolean;senderName:string};

function MessagesContent(){
  const searchParams=useSearchParams();
  const router=useRouter();
  const initialUserId=searchParams.get("userId");
  
  const [contacts,setContacts]=useState<Contact[]>([]);
  const [messages,setMessages]=useState<Msg[]>([]);
  const [active,setActive]=useState(initialUserId||"");
  const [body,setBody]=useState("");
  
  const activeRef = useRef(active);
  useEffect(()=>{activeRef.current=active;},[active]);

  const load=async(forceUserId?:string)=>{
    const qs=forceUserId?`?userId=${forceUserId}`:'';
    const r=await fetch('/api/messages'+qs);
    if(r.ok){
      const x=await r.json();
      setContacts(x.contacts||[]);
      setMessages(x.messages||[]);
      if(!activeRef.current && x.contacts?.[0] && !forceUserId){
        setActive(x.contacts[0].id);
      }
    }
  };

  useEffect(()=>{
    load(initialUserId||undefined);
    const interval = setInterval(() => {
      load(initialUserId||undefined);
    }, 10000);
    return () => clearInterval(interval);
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

  async function send(e:React.FormEvent){
    e.preventDefault();
    if(!active||!body.trim())return;
    const r=await fetch('/api/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({recipientId:active,body})
    });
    if(r.ok){
      setBody('');
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
                <p>{m.body}</p>
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
            {!thread.length&&active&&<div className="empty">Konuşmayı başlatmak için bir mesaj yaz.</div>}
            {!active&&<div className="empty">Sol menüden bir kişi seçin.</div>}
          </div>
          
          {active && (
            <form className="chat-form" onSubmit={send}>
              <input value={body} onChange={e=>setBody(e.target.value)} placeholder="Mesajını yaz..."/>
              <button className="primary" disabled={!body.trim()}>Gönder</button>
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
