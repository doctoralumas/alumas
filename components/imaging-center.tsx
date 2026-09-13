'use client';import {useEffect,useState} from 'react';import {Trash2} from "@/components/icons";
type Row={id:string;title:string;modality:string;bodyPart?:string;provider?:string;reportText?:string;impression?:string;performedAt:string;fileName?:string};
export default function ImagingCenter({patientId,doctorMode=false}:{patientId?:string;doctorMode?:boolean}){
  const [rows,setRows]=useState<Row[]>([]),[open,setOpen]=useState(false),[msg,setMsg]=useState('');
  const load=()=>fetch(`/api/health/imaging${patientId?`?patientId=${patientId}`:''}`).then(r=>r.ok?r.json():[]).then(setRows);
  useEffect(()=>{load()},[patientId]);
  
  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=e.currentTarget;
    const fileInput=f.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    setMsg('Kaydediliyor...');
    try {
      const formData = new FormData(f);
      
      // HİBRİT YÜKLEME (SMART ROUTING)
      // 8 MB'dan büyük dosyalar veya DICOM/ZIP gibi ağır formatlar için Presigned URL ile Doğrudan R2 Yüklemesi
      if (file && (file.size > 8 * 1024 * 1024 || !['application/pdf','image/jpeg','image/png'].includes(file.type))) {
        setMsg('Büyük dosya algılandı. Doğrudan güvenli buluta yükleniyor... Lütfen bekleyin.');
        
        // 1. Presign URL al
        const presignRes = await fetch('/api/health/imaging/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size })
        });
        
        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error || 'Yükleme bileti alınamadı.');
        }
        
        const { presignedUrl, storagePath } = await presignRes.json();
        
        // 2. Dosyayı doğrudan Cloudflare R2'ye yükle (Sunucuyu bypass et)
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' }
        });
        
        if (!uploadRes.ok) throw new Error('Bulut yüklemesi başarısız oldu.');
        
        // 3. Dosyayı formdan çıkar ve Metadata'yı API'ye yolla
        formData.delete('file');
        formData.append('storagePath', storagePath);
        formData.append('fileName', file.name);
        formData.append('mimeType', file.type || 'application/octet-stream');
        formData.append('sizeBytes', file.size.toString());
      }
      
      // Metadata (veya küçük dosya) kaydı
      const r=await fetch('/api/health/imaging',{method:'POST',body:formData});
      if(r.status===413) throw new Error('Dosya boyutu veya depolama kotası aşıldı.');
      if(!r.ok){
        const t=await r.text();
        try { throw new Error(JSON.parse(t).error || 'Kaydedilemedi'); }
        catch { throw new Error(`Sunucu hatası (${r.status})`); }
      }
      
      setMsg('Görüntüleme sonucu başarıyla kaydedildi.');
      setOpen(false);
      load();
    } catch(err:any){
      setMsg(err.message||'Bir hata oluştu.');
    }
  }
  
  async function remove(id:string){if(!confirm("Emin misiniz?"))return;await fetch(`/api/health/imaging/${id}`,{method:"DELETE"});load()}
  return <section className="panel health-section"><div className="row between"><div><h2>Görüntüleme & Radyoloji</h2><p>MR, BT, röntgen, ultrason ve diğer görüntüleme raporlarını zaman içinde sakla.</p></div>{!doctorMode&&<button className="secondary" onClick={()=>setOpen(v=>!v)}>+ Sonuç ekle</button>}</div>{open&&<form className="health-form-v14" onSubmit={add}><label>Başlık<input name="title" required placeholder="örn. Diz MR"/></label><label>Tür<select name="modality"><option>MR</option><option>BT</option><option>Röntgen</option><option>Ultrason</option><option>Mamografi</option><option>PET</option><option>Diğer</option></select></label><label>Bölge<input name="bodyPart" placeholder="örn. Sol diz"/></label><label>Kurum<input name="provider"/></label><label>Tarih<input name="performedAt" type="date"/></label><label className="wide">Rapor<textarea name="reportText" rows={4}/></label><label className="wide">Sonuç / İzlenim<textarea name="impression" rows={3}/></label><label className="wide">Görüntü Dosyası veya Rapor<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,.dcm,.zip"/></label><div className="wide"><button className="primary">Kaydet</button></div></form>}{msg&&<div className="notice-v14">{msg}</div>}<div className="timeline-v19">{rows.map(x=><article className="clinical-card-v19" key={x.id}><div className="row between"><div><span className="kicker">{x.modality}</span><h3>{x.title}</h3></div><time>{new Date(x.performedAt).toLocaleDateString('tr-TR')}</time></div><p>{[x.bodyPart,x.provider].filter(Boolean).join(' · ')}</p>{x.impression&&<div className="clinical-summary-v19"><b>Sonuç / İzlenim</b><span>{x.impression}</span></div>}{x.reportText&&<details><summary>Rapor metni</summary><p>{x.reportText}</p></details>}<div className="row between" style={{marginTop:'12px'}}><div>{x.fileName&&<a className="secondary compact" href={`/api/health/imaging/${x.id}/file`} target="_blank" rel="noopener noreferrer">Görüntüle / İndir</a>}</div>{!doctorMode&&<button className="icon-button text-red" onClick={()=>remove(x.id)}><Trash2 size={16}/></button>}</div></article>)}{!rows.length&&<div className="empty">Henüz görüntüleme sonucu yok.</div>}</div></section>
}
