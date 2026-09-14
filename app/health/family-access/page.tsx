"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import SectionVisual from "@/components/section-visual";
import { UserPlus, ShieldCheck, Handshake, Users, Eye, Pill, CalendarCheck, Ruler, PencilSimple, EnvelopeSimple, PaperPlaneRight, Check, X, CaretRight, CaretLeft } from "@phosphor-icons/react";

const perms=[
  { id: 'VIEW', label: 'Görüntüleme', icon: Eye, desc: 'Temel sağlık özetine salt okunur erişim' },
  { id: 'APPOINTMENTS', label: 'Randevular', icon: CalendarCheck, desc: 'Randevu ve etkinlikleri görebilme' },
  { id: 'REMINDERS', label: 'Hatırlatıcılar', icon: Pill, desc: 'İlaç ve görev hatırlatıcılarına erişim' },
  { id: 'VACCINATIONS', label: 'Aşılar', icon: ShieldCheck, desc: 'Aşı takvimi ve kayıtlarına erişim' },
  { id: 'GROWTH', label: 'Büyüme', icon: Ruler, desc: 'Boy, kilo ve baş çevresi kayıtları' },
  { id: 'EDIT_PROFILE', label: 'Düzenleme', icon: PencilSimple, desc: 'Profil bilgilerini değiştirebilme yetkisi' }
];

export default function Page(){
  const [profiles,setProfiles]=useState<any[]>([]);
  const [data,setData]=useState<any>({sent:[],received:[]});
  const [access,setAccess]=useState<any>({owned:[],granted:[]});
  const [profileId,setProfileId]=useState('');
  const [email,setEmail]=useState('');
  const [selected,setSelected]=useState<string[]>(['VIEW','APPOINTMENTS','REMINDERS']);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load=()=>{
    fetch('/api/health/special-profiles').then(r=>r.json()).then((x:any[])=>{
      setProfiles(x);
      if(!profileId&&x[0]) setProfileId(x[0].id);
    });
    fetch('/api/health/family-access/invites').then(r=>r.json()).then(setData);
    fetch('/api/health/family-access').then(r=>r.json()).then(setAccess);
  };
  useEffect(() => { load(); },[]);

  async function invite(){
    const r=await fetch('/api/health/family-access/invites',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({specialProfileId:profileId,email,permissions:selected,role:'CAREGIVER'})
    });
    if(r.ok){
      setEmail('');
      setMsg({ text: 'Davet başarıyla gönderildi!', type: 'success' });
      load();
    }else{
      const j = await r.json();
      setMsg({ text: j.error||'Davet gönderilemedi', type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  }

  async function act(id:string,action:string){
    await fetch('/api/health/family-access/invites/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});
    load();
  }

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/health/family-hub" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> Aile Paneline Dön
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">Güvenli Paylaşım</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>Aile Erişimleri</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Yakınlarınızı davet edin, her aile profilinin erişim yetkilerini detaylıca belirleyin.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        
        {/* Davet Gönder */}
        <section className="panel" style={{ padding: "32px", borderRadius: "24px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "10px", borderRadius: "12px" }}>
              <UserPlus size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Yakın Davet Et</h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Bir yakınınızı e-posta üzerinden ailenize dahil edin.</span>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Profil Seçimi</label>
              <select value={profileId} onChange={e=>setProfileId(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a" }}>
                {profiles.map(p=><option key={p.id} value={p.id}>{p.name} ({p.type==='CHILD'?'Çocuk':'Gebelik'})</option>)}
                {!profiles.length && <option value="">Profil bulunamadı</option>}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Davet Edilecek E-posta</label>
              <div style={{ position: "relative" }}>
                <EnvelopeSimple size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="yakininiz@example.com" style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", border: "1px solid #cbd5e1", color: "#0f172a" }} />
              </div>
            </div>
          </div>

          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "12px" }}>Yetkilendirmeler</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {perms.map((p) => {
              const active = selected.includes(p.id);
              const disabled = p.id === 'VIEW';
              return (
                <label key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px", borderRadius: "12px", border: active ? "2px solid #0284c7" : "1px solid #cbd5e1", background: active ? "#f0f9ff" : "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1, transition: "all 0.2s" }}>
                  <input type="checkbox" checked={active} disabled={disabled} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(x=>x!==p.id))} style={{ marginTop: "4px" }} />
                  <div>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: active ? "#0369a1" : "#475569", marginBottom: "2px" }}><p.icon size={16} weight={active ? "duotone" : "regular"} /> {p.label}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block", lineHeight: "1.3" }}>{p.desc}</span>
                  </div>
                </label>
              )
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="primary" onClick={invite} disabled={!profileId||!email} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "12px" }}>
              <PaperPlaneRight size={18} weight="bold" /> Daveti Gönder
            </button>
            {msg.text && (
              <span style={{ fontSize: "14px", fontWeight: 500, color: msg.type === 'success' ? '#16a34a' : '#dc2626' }}>{msg.text}</span>
            )}
          </div>
        </section>

        {/* Gelen Davetler */}
        <section className="panel" style={{ padding: "32px", borderRadius: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#fef08a", color: "#a16207", padding: "10px", borderRadius: "12px" }}>
              <Handshake size={24} weight="duotone" />
            </div>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Bana Gelen Davetler</h2>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.received?.length ? data.received.map((i:any)=>(
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{i.profile.name}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Gönderen: {i.sender.name} • İzinler: {i.permissions.length} adet</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={()=>act(i.id,'accept')} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "100px", background: "#16a34a", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}><Check size={16} /> Kabul</button>
                  <button onClick={()=>act(i.id,'reject')} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "100px", background: "#f1f5f9", color: "#475569", border: "none", fontWeight: 600, cursor: "pointer" }}><X size={16} /> Red</button>
                </div>
              </div>
            )) : <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>Bekleyen bir davetiniz bulunmuyor.</div>}
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Benim Paylaştıklarım */}
          <section className="panel" style={{ padding: "32px", borderRadius: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "#dcfce7", color: "#16a34a", padding: "10px", borderRadius: "12px" }}>
                <Users size={24} weight="duotone" />
              </div>
              <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Paylaştığım Profiller</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {access.owned?.length ? access.owned.map((p:any)=>(
                <div key={p.id}>
                  <h3 style={{ fontSize: "15px", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>{p.name}</h3>
                  {p.sharedAccess?.length ? p.sharedAccess.map((a:any)=>(
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "8px" }}>
                      <div>
                        <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginBottom: "2px" }}>{a.user.name}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Rol: {a.role === 'CAREGIVER' ? 'Bakım Sağlayıcı' : a.role}</span>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 600, background: "#dcfce7", color: "#16a34a", padding: "4px 8px", borderRadius: "10px" }}>Aktif</span>
                    </div>
                  )) : <span style={{ fontSize: "13px", color: "#94a3b8" }}>Paylaşım yapılmamış.</span>}
                </div>
              )) : <div style={{ fontSize: "14px", color: "#64748b" }}>Oluşturduğunuz profil bulunmuyor.</div>}
            </div>
          </section>

          {/* Bana Paylaşılanlar */}
          <section className="panel" style={{ padding: "32px", borderRadius: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "#fce7f3", color: "#db2777", padding: "10px", borderRadius: "12px" }}>
                <ShieldCheck size={24} weight="duotone" />
              </div>
              <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Bana Paylaşılan Profiller</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {access.granted?.length ? access.granted.map((a:any)=>(
                <Link key={a.id} href={`/health/family?profile=${a.specialProfileId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", textDecoration: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s" }} className="hover-shadow">
                  <div>
                    <strong style={{ display: "block", fontSize: "15px", color: "#0f172a", marginBottom: "4px" }}>{a.profile.name}</strong>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Sahibi: {a.profile.user.name}</span>
                  </div>
                  <div style={{ color: "#0284c7", background: "#e0f2fe", padding: "6px", borderRadius: "50%" }}>
                    <CaretRight size={16} weight="bold" />
                  </div>
                </Link>
              )) : <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>Size paylaşılan profil bulunmuyor.</div>}
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}
