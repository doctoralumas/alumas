"use client";
import VerificationDocumentsPanel from "@/components/professional/VerificationDocumentsPanel";
import { PROFESSIONAL_ACCOUNT_CONFIG,ProfessionalAccountTypeKey } from "@/lib/professional/account-config";

const moduleLabels:Record<string,string>={
 profile:"Profil",verification:"Belge Doğrulama",appointments:"Randevular",patients:"Hastalar",
 messages:"Mesajlar",schedule:"Çalışma Saatleri",organizations:"Kurumlar",branches:"Şubeler",
 departments:"Bölümler",doctors:"Doktorlar",services:"Hizmetler",insurance:"Sigortalar",
 hours:"Çalışma Saatleri",duty:"Nöbet Durumu",location:"Konum",results:"Sonuçlar",
 serviceAreas:"Hizmet Bölgeleri",requests:"Talepler",teams:"Ekipler",
 healthTourismAuthorization:"Yetki Belgesi",packages:"Paketler",partners:"Anlaşmalı Kurumlar",
 hotels:"Oteller",transfers:"Transferler",leads:"Hasta Talepleri"
};
export default function ProfessionalDashboard({account}:{account:any}){
 const cfg=PROFESSIONAL_ACCOUNT_CONFIG[account.accountType as ProfessionalAccountTypeKey];
 const approved=account.verificationStatus==="APPROVED";
 const agencyBlocked=account.accountType==="HEALTH_TOURISM_AGENCY" && account.healthTourism?.status!=="APPROVED";
 return <main className="professional-shell">
   <header className="professional-hero">
    <div><small>Alumas Professional</small><h1>{account.displayName}</h1><p>{cfg?.label}</p></div>
    <span className={`verify-pill ${approved&&!agencyBlocked?"ok":"pending"}`}>{approved&&!agencyBlocked?"✓ Doğrulandı":"Doğrulama bekleniyor"}</span>
   </header>
   {agencyBlocked&&<div className="professional-warning">Sağlık turizmi yetki belgeniz doğrulanmadan acente hizmetleri, paket yayını ve hasta yönlendirme özellikleri aktifleşmez.</div>}
   <section className="professional-grid">
    {(cfg?.modules||[]).map(m=><a key={m} href={`/professional/${account.id}/${m}`} className="professional-card"><b>{moduleLabels[m]||m}</b><span>Yönet →</span></a>)}
   </section>
 <VerificationDocumentsPanel account={account} />
 </main>
}
