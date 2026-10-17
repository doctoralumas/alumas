'use client';
import {useEffect,useState} from 'react';
import { Trash, FilePdf, FileImage, FileZip, Images, DownloadSimple, Plus, X, UploadSimple, ShieldCheck, Heartbeat } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";

type Row={id:string;title:string;modality:string;bodyPart?:string;provider?:string;reportText?:string;impression?:string;performedAt:string;fileName?:string;mimeType?:string};

export default function ImagingCenter({patientId,doctorMode=false}:{patientId?:string;doctorMode?:boolean}){
  const t = useTranslations("health.healthImaging");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";
  const [rows,setRows]=useState<Row[]>([]);
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState('');
  const [isSuccess,setIsSuccess]=useState(false);
  const [loading,setLoading]=useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const load=()=>fetch(`/api/health/imaging${patientId?`?patientId=${patientId}`:''}`).then(r=>r.ok?r.json():[]).then(setRows).finally(()=>setLoading(false));
  useEffect(()=>{load()},[patientId]);
  
  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=e.currentTarget;
    const fileInput=f.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    setMsg(t('preparing'));
    setIsUploading(true);

    try {
      const formData = new FormData(f);
      
      // Smart routing: large files upload directly to cloud storage
      if (file && (file.size > 8 * 1024 * 1024 || !['application/pdf','image/jpeg','image/png'].includes(file.type))) {
        setMsg(t('largeFileDetected', { size: (file.size / (1024*1024)).toFixed(1) }));
        
        // 1. Get presigned URL
        const presignRes = await fetch('/api/health/imaging/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size })
        });
        
        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error || t('presignFailed'));
        }
        
        const { presignedUrl, storagePath } = await presignRes.json();
        
        // 2. Upload directly to Cloudflare R2
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' }
        });
        
        if (!uploadRes.ok) throw new Error(t('uploadFailed'));
        
        // 3. Remove file from form and append metadata
        formData.delete('file');
        formData.append('storagePath', storagePath);
        formData.append('fileName', file.name);
        formData.append('mimeType', file.type || 'application/octet-stream');
        formData.append('sizeBytes', file.size.toString());
      }
      
      // Metadata / small file submit
      const r=await fetch('/api/health/imaging',{method:'POST',body:formData});
      if(r.status===413) throw new Error(t('quotaExceeded'));
      if(!r.ok){
        const text=await r.text();
        try { throw new Error(JSON.parse(text).error || t('genericError')); }
        catch { throw new Error(`Server error (${r.status})`); }
      }
      
      setIsSuccess(true);
      setMsg(t('saveSuccess'));
      setTimeout(() => {
        setOpen(false);
        setMsg('');
      }, 1500);
      load();
    } catch(err:any){
      setIsSuccess(false);
      setMsg(err.message||t('genericError'));
    } finally {
      setIsUploading(false);
    }
  }
  
  async function remove(id:string){
    if(!confirm(t('deleteConfirm')))return;
    await fetch(`/api/health/imaging/${id}`,{method:"DELETE"});
    load();
  }

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || mimeType === 'application/pdf') return <FilePdf size={24} weight="duotone" color="#ef4444" />;
    if (['jpg','jpeg','png'].includes(ext||'') || mimeType?.startsWith('image/')) return <FileImage size={24} weight="duotone" color="#3b82f6" />;
    if (['zip','dcm'].includes(ext||'')) return <FileZip size={24} weight="duotone" color="#f59e0b" />;
    return <Images size={24} weight="duotone" color="#64748b" />;
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#f5f3ff", padding: "16px", borderRadius: "24px" }}>
            <Images size={32} weight="duotone" color="#8b5cf6" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#8b5cf6" }}>{t("kicker")}</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>{t("title")}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{t("subtitle")}</p>
          </div>
        </div>
        {!doctorMode && (
          <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {open ? <X size={20} /> : <Plus size={20} />} {open ? t("cancel") : t("uploadNew")}
          </button>
        )}
      </div>

      {open && (
        <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><UploadSimple size={20} weight="bold" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{t("uploadTitle")}</h2>
          </div>
          
          <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("titleLabel")} <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="title" required placeholder={t("titlePlaceholder")} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("modalityLabel")} <span style={{ color: "#ef4444" }}>*</span></label>
                <select name="modality" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}>
                  <option value="MR">{t("modalities.MR")}</option>
                  <option value="BT">{t("modalities.BT")}</option>
                  <option value="Röntgen">{t("modalities.XRAY")}</option>
                  <option value="Ultrason">{t("modalities.ULTRASOUND")}</option>
                  <option value="Mamografi">{t("modalities.MAMMOGRAPHY")}</option>
                  <option value="PET">{t("modalities.PET")}</option>
                  <option value="Diğer">{t("modalities.OTHER")}</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("bodyPartLabel")}</label>
                <input name="bodyPart" placeholder={t("bodyPartPlaceholder")} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("providerLabel")}</label>
                <input name="provider" placeholder={t("providerPlaceholder")} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("performedAtLabel")}</label>
                <input name="performedAt" type="date" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("impressionLabel")}</label>
                <textarea name="impression" rows={2} placeholder={t("impressionPlaceholder")} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", resize: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("reportTextLabel")}</label>
                <textarea name="reportText" rows={2} placeholder={t("reportTextPlaceholder")} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", resize: "none", fontSize: "15px" }} />
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", padding: "24px", borderRadius: "16px", textAlign: "center" }}>
              <ShieldCheck size={32} weight="duotone" color="#8b5cf6" style={{ marginBottom: "8px" }} />
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("fileUploadLabel")}</label>
              <input type="file" name="file" accept="application/pdf,image/jpeg,image/png,.dcm,.zip" style={{ maxWidth: "100%", fontSize: "14px" }} />
              <p style={{ margin: "12px 0 0", fontSize: "13px", color: "#94a3b8" }}>{t("fileUploadNote")}</p>
            </div>

            <button disabled={isUploading} style={{ padding: "16px", background: "#8b5cf6", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: isUploading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isUploading ? 0.7 : 1 }}>
              {isUploading ? t("uploading") : t("saveReport")}
            </button>
            {msg && <div style={{ background: isSuccess ? '#f5f3ff' : '#fef2f2', color: isSuccess ? '#6d28d9' : '#b91c1c', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center" }}>{msg}</div>}
          </form>
        </div>
      )}

      {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>{t("loading")}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "48px" }}>
        {rows.map(x => (
          <article key={x.id} style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#8b5cf6", background: "#f5f3ff", padding: "4px 8px", borderRadius: "100px", display: "inline-block", marginBottom: "8px" }}>
                  {x.modality === "Röntgen" ? t("modalities.XRAY") : x.modality === "Ultrason" ? t("modalities.ULTRASOUND") : x.modality === "Mamografi" ? t("modalities.MAMMOGRAPHY") : x.modality === "Diğer" ? t("modalities.OTHER") : x.modality}
                </span>
                <h3 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>{x.title}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "15px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Heartbeat size={16} /> {[x.bodyPart, x.provider].filter(Boolean).join(' • ')}
                </p>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", background: "#f8fafc", padding: "8px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                {new Date(x.performedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {x.impression && (
              <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "16px 20px", borderRadius: "0 16px 16px 0" }}>
                <strong style={{ display: "block", fontSize: "14px", color: "#b91c1c", marginBottom: "4px" }}>{t("impressionSummary")}</strong>
                <span style={{ fontSize: "15px", color: "#991b1b", lineHeight: "1.5" }}>{x.impression}</span>
              </div>
            )}

            {x.reportText && (
              <details style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px" }}>
                <summary style={{ fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer", outline: "none" }}>{t("showReportText")}</summary>
                <div style={{ marginTop: "12px", fontSize: "14px", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                  {x.reportText}
                </div>
              </details>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "20px", flexWrap: "wrap", gap: "16px" }}>
              {x.fileName ? (
                <a href={`/api/health/imaging/${x.id}/file`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0f172a", color: "#fff", padding: "10px 20px", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", transition: "all 0.2s" }} className="hover-shadow">
                  {getFileIcon(x.mimeType, x.fileName)}
                  <span>{t("viewFile")}</span>
                </a>
              ) : (
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>{t("noFile")}</span>
              )}

              {!doctorMode && (
                <button onClick={() => remove(x.id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: "#ef4444", border: "1px solid #fecaca", padding: "10px 16px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "background 0.2s" }} className="hover-bg-red-50">
                  <Trash size={16} /> {t("delete")}
                </button>
              )}
            </div>

          </article>
        ))}

        {!loading && rows.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1" }}>
            <Images size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>{t("empty")}</div>
          </div>
        )}
      </div>

    </div>
  )
}
