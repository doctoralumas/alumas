"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import SectionVisual from "@/components/section-visual";
import HealthIntegrations from "@/components/health-integrations";
import HealthSharing from "@/components/health-sharing";
import CarePlans from "@/components/care-plans";
import { Plus, Drop, Heartbeat, Scale, FileText, FileArrowUp, Trash, CaretRight, Activity, Flask, Info, UploadSimple, PlusCircle } from "@phosphor-icons/react";

type Doc={id:string;title:string;fileName:string;category:string;createdAt:string};
type Lab={id:string;testName:string;value:string;unit?:string;reference?:string;status:string;measuredAt:string};
type Entry={id:string;type:string;value:number;unit:string;measuredAt:string};

export default function Health(){
  const [entries,setEntries]=useState<Entry[]>([]);
  const [docs,setDocs]=useState<Doc[]>([]);
  const [labs,setLabs]=useState<Lab[]>([]);
  
  const [open,setOpen]=useState(false);
  const [docOpen,setDocOpen]=useState(false);
  const [labOpen,setLabOpen]=useState(false);
  
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(true);

  const load=async()=>{
    setLoading(true);
    try {
      const [docsRes, labsRes, entriesRes] = await Promise.all([
        fetch('/api/health/documents'),
        fetch('/api/health/labs'),
        fetch('/api/health')
      ]);
      if(docsRes.ok) setDocs(await docsRes.json());
      if(labsRes.ok) setLabs(await labsRes.json());
      if(entriesRes.ok) setEntries(await entriesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{load()},[]);

  async function addEntry(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const body = { type: f.get('type'), value: Number(f.get('value')), unit: f.get('unit') };
    const r = await fetch('/api/health', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if(r.ok){
      setOpen(false);
      load();
    }
  }

  async function upload(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=e.currentTarget;
    const fileInput=f.querySelector('input[type="file"]') as HTMLInputElement;
    if(fileInput?.files?.[0]&&fileInput.files[0].size>4.5*1024*1024){
      setMessage('Dosya boyutu çok büyük (Maksimum 4.5 MB yüklenebilir).');
      return;
    }
    setMessage('Yükleniyor...');
    try{
      const r=await fetch('/api/health/documents',{method:'POST',body:new FormData(f)});
      if(r.status===413){setMessage('Dosya boyutu çok büyük (Vercel sınırı 4.5 MB).');return}
      if(!r.ok){
        const t=await r.text();
        try{const j=JSON.parse(t);setMessage(j.error||'Yükleme başarısız')}catch{setMessage(`Sunucu hatası (${r.status})`)}
        return;
      }
      await r.json();
      setMessage('Belge kaydedildi.');
      setDocOpen(false);
      load();
    }catch(err:any){
      setMessage(err.message||'Bir hata oluştu.');
    }
  }

  async function addLab(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const body=Object.fromEntries(f.entries());
    const r=await fetch('/api/health/labs',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
    });
    if(r.ok){
      setLabOpen(false);
      load();
    }
  }

  async function deleteLab(id:string){
    if(!confirm("Emin misiniz?"))return;
    await fetch(`/api/health/labs/${id}`,{method:"DELETE"});
    load();
  }

  async function deleteDoc(id:string){
    if(!confirm("Emin misiniz?"))return;
    await fetch(`/api/health/documents/${id}`,{method:"DELETE"});
    load();
  }
  
  async function deleteEntry(id:string){
    if(!confirm("Emin misiniz?"))return;
    await fetch(`/api/health/${id}`,{method:"DELETE"}); // Assuming this endpoint exists, if not it will just 404, but standard is good
    load();
  }

  const getEntryIcon = (type: string) => {
    const t = type.toLowerCase();
    if(t.includes('glukoz') || t.includes('şeker')) return <Drop size={24} weight="duotone" color="#ea580c" />;
    if(t.includes('tansiyon') || t.includes('nabız')) return <Heartbeat size={24} weight="duotone" color="#ef4444" />;
    if(t.includes('kilo') || t.includes('boy')) return <Scale size={24} weight="duotone" color="#0284c7" />;
    return <Activity size={24} weight="duotone" color="#8b5cf6" />;
  }

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="health" alt="Sağlığım" />
      
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">Kişisel Alan</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>Sağlığım</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Ölçümlerinizi, laboratuvar sonuçlarınızı ve belgelerinizi güvenle saklayın.</p>
          </div>
          <Link href="/services" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "100px", background: "#f8fafc", color: "#0f172a", fontWeight: 600, border: "1px solid #e2e8f0", textDecoration: "none", transition: "all 0.2s" }} className="hover-shadow">
            Tüm Hizmetler <CaretRight size={16} />
          </Link>
        </div>
      </div>

      {/* Hızlı Ölçüm Aksiyonları */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
        <Link href="/health/blood-pressure" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "#fef2f2", color: "#dc2626", borderRadius: "16px", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
          <PlusCircle size={20} weight="fill" /> Tansiyon Ekle
        </Link>
        <Link href="/health/glucose" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "#fff7ed", color: "#ea580c", borderRadius: "16px", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
          <PlusCircle size={20} weight="fill" /> Şeker Ekle
        </Link>
        <Link href="/health/body" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "#f0f9ff", color: "#0284c7", borderRadius: "16px", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
          <PlusCircle size={20} weight="fill" /> Kilo Ekle
        </Link>
        <button onClick={()=>setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#475569", borderRadius: "16px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          <Plus size={20} /> Diğer Ölçüm
        </button>
      </div>

      {open && (
        <form onSubmit={addEntry} style={{ background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "32px", display: "flex", gap: "12px", flexWrap: "wrap", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
          <input name="type" placeholder="Ölçüm (Örn. Glukoz)" required style={{ flex: 1, minWidth: "150px", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }}/>
          <input name="value" placeholder="Değer (Rakam)" type="number" step="0.01" required style={{ width: "120px", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }}/>
          <input name="unit" placeholder="Birim (Örn. mg/dL)" required style={{ width: "120px", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }}/>
          <button type="submit" style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, cursor: "pointer" }}>Kaydet</button>
        </form>
      )}

      {/* Dinamik Ölçümler Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "48px" }}>
        {entries.map(m=>(
          <div key={m.id} style={{ background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", position: "relative", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "14px" }}>
                {getEntryIcon(m.type)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>{m.type}</span>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {m.value} <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 500 }}>{m.unit}</span>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "auto", paddingTop: "12px", borderTop: "1px dashed #e2e8f0" }}>
              {new Date(m.measuredAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {!loading && !entries.length && (
          <div style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
            <Activity size={32} weight="duotone" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            Henüz manuel bir ölçüm eklemediniz.
          </div>
        )}
      </div>

      {/* Laboratuvar ve Belgeler (2 Kolon) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        
        {/* Laboratuvar */}
        <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#e0e7ff", padding: "8px", borderRadius: "10px", color: "#4f46e5" }}><Flask size={20} weight="duotone" /></div>
              <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Laboratuvar</h2>
            </div>
            <button onClick={()=>setLabOpen(!labOpen)} style={{ padding: "8px 16px", borderRadius: "100px", border: "1px solid #cbd5e1", background: "#fff", fontWeight: 600, color: "#0f172a", cursor: "pointer", fontSize: "13px" }}>+ Sonuç Ekle</button>
          </div>
          
          {labOpen && (
            <form onSubmit={addLab} style={{ padding: "20px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "grid", gap: "12px" }}>
              <input name="testName" placeholder="Test (Örn. Ferritin)" required style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}/>
              <div style={{ display: "flex", gap: "12px" }}>
                <input name="value" placeholder="Sonuç" required style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}/>
                <input name="unit" placeholder="Birim" style={{ width: "80px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}/>
              </div>
              <input name="reference" placeholder="Referans Aralığı" style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}/>
              <select name="status" style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#fff" }}>
                <option value="normal">Normal</option><option value="low">Düşük</option><option value="high">Yüksek</option>
              </select>
              <button type="submit" style={{ padding: "12px", background: "#4f46e5", color: "#fff", borderRadius: "10px", border: "none", fontWeight: 600, cursor: "pointer" }}>Kaydet</button>
            </form>
          )}

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {labs.map(l=>(
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div>
                  <strong style={{ display: "block", color: "#0f172a", fontSize: "15px", marginBottom: "4px" }}>{l.testName}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(l.measuredAt).toLocaleDateString('tr-TR')} • {l.reference || 'Ref Yok'}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>{l.value} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{l.unit}</span></strong>
                    <div style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", display: "inline-block", marginTop: "4px", background: l.status==='normal' ? '#dcfce7' : l.status==='high' ? '#fee2e2' : '#fef3c7', color: l.status==='normal' ? '#16a34a' : l.status==='high' ? '#dc2626' : '#d97706' }}>
                      {l.status==='normal' ? 'Normal' : l.status==='high' ? 'Yüksek' : 'Düşük'}
                    </div>
                  </div>
                  <button onClick={()=>deleteLab(l.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}><Trash size={18}/></button>
                </div>
              </div>
            ))}
            {!labs.length && !loading && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>Henüz sonuç eklenmedi.</div>
            )}
          </div>
        </section>

        {/* Belgeler */}
        <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#fce7f3", padding: "8px", borderRadius: "10px", color: "#db2777" }}><FileText size={20} weight="duotone" /></div>
              <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Belgeler</h2>
            </div>
            <button onClick={()=>setDocOpen(!docOpen)} style={{ padding: "8px 16px", borderRadius: "100px", border: "1px solid #cbd5e1", background: "#fff", fontWeight: 600, color: "#0f172a", cursor: "pointer", fontSize: "13px" }}>+ Belge Yükle</button>
          </div>

          {docOpen && (
            <form onSubmit={upload} style={{ padding: "20px", background: "#fdf2f8", borderBottom: "1px solid #fbcfe8", display: "grid", gap: "12px" }}>
              <input name="title" placeholder="Belge Başlığı" required style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #fbcfe8", outline: "none" }}/>
              <select name="category" style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #fbcfe8", outline: "none", background: "#fff" }}>
                <option value="lab">Laboratuvar</option><option value="report">Rapor</option><option value="imaging">Görüntüleme</option>
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input name="file" type="file" accept="application/pdf,image/jpeg,image/png" required style={{ flex: 1, fontSize: "13px" }}/>
              </div>
              {message && <div style={{ fontSize: "13px", color: "#db2777", fontWeight: 500 }}><Info size={14} style={{verticalAlign:'middle',marginRight:'4px'}}/>{message}</div>}
              <button type="submit" style={{ padding: "12px", background: "#db2777", color: "#fff", borderRadius: "10px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <UploadSimple size={18} /> Yükle
              </button>
            </form>
          )}

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {docs.map(d=>(
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ color: "#94a3b8" }}><FileText size={32} weight="duotone" /></div>
                  <div>
                    <strong style={{ display: "block", color: "#0f172a", fontSize: "15px", marginBottom: "4px" }}>{d.title}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(d.createdAt).toLocaleDateString('tr-TR')} • {d.category === 'lab' ? 'Laboratuvar' : d.category === 'imaging' ? 'Görüntüleme' : 'Rapor'}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <a href={`/api/health/documents/${d.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: "#fff", border: "1px solid #cbd5e1", color: "#475569" }}>
                    <FileArrowUp size={18} />
                  </a>
                  <button onClick={()=>deleteDoc(d.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: "#fee2e2", border: "none", color: "#ef4444", cursor: "pointer" }}>
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
            {!docs.length && !loading && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>Henüz belge yüklenmedi.</div>
            )}
          </div>
        </section>
      </div>

      <HealthIntegrations />
      <HealthSharing />
      <CarePlans />
      
    </div>
  )
}
