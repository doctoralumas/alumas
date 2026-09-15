"use client";
import { useEffect, useState, useMemo } from 'react';
import { PhoneCall, Heart, MagnifyingGlass, Ambulance, UserList } from "@phosphor-icons/react";

export default function HealthPhoneDirectory(){
  const [rows,setRows]=useState<any[]>([]);
  const [fav,setFav]=useState<Set<string>>(new Set());
  const [q, setQ]=useState('');
  const [loading, setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      fetch('/api/emergency').then(r=>r.json()),
      fetch('/api/emergency/favorites').then(r=>r.json())
    ]).then(([a,b])=>{
      setRows(Array.isArray(a)?a:[]);
      setFav(new Set((Array.isArray(b)?b:[]).map((x:any)=>x.directoryItemId)));
    }).finally(()=>setLoading(false));
  },[]);

  async function toggle(id:string){
    if(fav.has(id)){
      await fetch('/api/emergency/favorites',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({directoryItemId:id})});
      setFav(s=>{const n=new Set(s);n.delete(id);return n});
    }else{
      const r=await fetch('/api/emergency/favorites',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({directoryItemId:id})});
      if(r.ok) setFav(s=>new Set([...s,id]));
    }
  }

  // iOS Contacts stili alfabetik gruplama
  const groupedContacts = useMemo(() => {
    const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || (r.phone && r.phone.includes(q)));
    
    // Önce favoriler
    const favorites = filtered.filter(r => fav.has(r.id)).sort((a,b) => a.name.localeCompare(b.name));
    
    // Kalanları baş harfe göre grupla
    const others = filtered.filter(r => !fav.has(r.id)).sort((a,b) => a.name.localeCompare(b.name));
    const groups: Record<string, any[]> = {};
    
    others.forEach(r => {
      const letter = r.name.charAt(0).toUpperCase();
      if(!groups[letter]) groups[letter] = [];
      groups[letter].push(r);
    });
    
    return { favorites, groups };
  }, [rows, fav, q]);

  return (
    <div>
      {/* 112 Hızlı Arama (Sabit üst kısımda) */}
      <a href="tel:112" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "#fff", marginBottom: "32px", boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)", transition: "transform 0.2s" }} className="hover-shadow">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ambulance size={32} weight="fill" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, letterSpacing: "1px" }}>112 Acil Çağrı</h2>
            <span style={{ fontSize: "14px", opacity: 0.9 }}>Tek dokunuşla ara</span>
          </div>
        </div>
        <PhoneCall size={32} weight="duotone" />
      </a>

      {/* Arama */}
      <div style={{ position: "relative", marginBottom: "32px" }}>
        <MagnifyingGlass size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "16px" }} />
        <input 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
          placeholder="İsim veya numara ara..."
          style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: "20px", border: "none", background: "#f1f5f9", outline: "none", fontSize: "16px", color: "#0f172a" }}
        />
      </div>

      <div style={{ background: "#fff", borderRadius: "32px", border: "1px solid #e2e8f0", padding: "8px", overflow: "hidden" }}>
        {loading && <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Rehber yükleniyor...</div>}
        
        {/* Favoriler Bölümü */}
        {!loading && groupedContacts.favorites.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ padding: "16px 24px 8px", fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Favoriler</div>
            {groupedContacts.favorites.map((x:any, index:number) => (
              <ContactRow key={x.id} contact={x} isFav={true} onToggleFav={() => toggle(x.id)} isLast={index === groupedContacts.favorites.length - 1} />
            ))}
          </div>
        )}

        {/* Alfabetik Gruplar */}
        {!loading && Object.keys(groupedContacts.groups).map((letter, letterIndex, letterArray) => (
          <div key={letter}>
            <div style={{ padding: "16px 24px 8px", fontSize: "14px", fontWeight: 700, color: "#475569", background: "#f8fafc" }}>{letter}</div>
            {groupedContacts.groups[letter].map((x:any, index:number) => (
              <ContactRow key={x.id} contact={x} isFav={false} onToggleFav={() => toggle(x.id)} isLast={index === groupedContacts.groups[letter].length - 1} />
            ))}
          </div>
        ))}

        {!loading && rows.length > 0 && groupedContacts.favorites.length === 0 && Object.keys(groupedContacts.groups).length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <UserList size={48} weight="duotone" style={{ marginBottom: "16px", opacity: 0.5 }} />
            <div style={{ fontSize: "16px" }}>Sonuç bulunamadı.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactRow({ contact, isFav, onToggleFav, isLast }: { contact: any, isFav: boolean, onToggleFav: () => void, isLast: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: isLast ? "none" : "1px solid #f1f5f9", transition: "background 0.2s" }} className="hover-bg-slate-50">
      
      {/* Avatar/Initials */}
      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#475569", marginRight: "16px" }}>
        {contact.name.charAt(0).toUpperCase()}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>{contact.name}</div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>
          {contact.kind} {contact.city ? `• ${contact.city}` : ''} {contact.phone ? `• ${contact.phone}` : ''}
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onToggleFav} style={{ width: "40px", height: "40px", borderRadius: "50%", background: isFav ? "#fdf2f8" : "transparent", border: "none", color: isFav ? "#db2777" : "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
          <Heart size={20} weight={isFav ? "fill" : "regular"} />
        </button>
        
        {contact.phone && (
          <a href={`tel:${contact.phone}`} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "background 0.2s" }}>
            <PhoneCall size={20} weight="fill" />
          </a>
        )}
      </div>
    </div>
  )
}