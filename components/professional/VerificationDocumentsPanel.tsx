"use client";
import { requiredDocsFor } from "@/lib/professional/document-requirements";

export default function VerificationDocumentsPanel({account}:{account:any}){
  const req=requiredDocsFor(account.accountType);
  return <section className="verification-panel">
    <div className="verification-head"><div><h2>Belge doğrulama</h2><p>Yalnız gerekli belgeleri yükleyin. Dosyalar herkese açık gösterilmez.</p></div></div>
    <div className="verification-list">
      {req.map(r=>{
        const doc=account.documents?.find((d:any)=>d.documentType===r.type);
        return <div className="verification-row" key={r.type}>
          <div><b>{r.label}</b><small>{r.required?"Zorunlu":"İsteğe bağlı"}{r.expires?" · Geçerlilik tarihi takip edilir":""}</small></div>
          <span className={`doc-status ${(doc?.status||"MISSING").toLowerCase()}`}>{doc?.status||"EKSİK"}</span>
        </div>
      })}
    </div>
    <p className="verification-note">Belge yükleme formu private object storage ile çalışmalıdır; public dosya URL'si kullanılmamalıdır.</p>
  </section>;
}
