"use client";import {useEffect,useState} from "react";import Link from "next/link";type Org=any;const label:any={PENDING:"Doğrulama bekliyor",APPROVED:"Doğrulanmış ve yayında",REJECTED:"Başvuru reddedildi",SUSPENDED:"Yayın durduruldu"};export default function BusinessDashboard(){const [rows,setRows]=useState<Org[]>([]);useEffect(()=>{fetch('/api/organizations/me').then(r=>r.json()).then(setRows)},[]);
const ORG_TYPES:any = {HOSPITAL: "Hastane", CLINIC: "Klinik", PHARMACY: "Eczane", IMAGING_CENTER: "Görüntüleme Merkezi"};
return <>{rows.length===0?<div className="empty">Henüz kurum başvurunuz yok.<br/><br/><Link className="primary" href="/business/apply">Kurumsal hesap oluştur</Link></div>:<div className="business-list">{rows.map(o=><section className="panel" key={o.id} style={{border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '24px'}}><div className="row between" style={{alignItems: 'flex-start', marginBottom: '24px'}}><div><span className="kicker" style={{color: '#0369a1', fontWeight: 600, letterSpacing: '0.5px'}}>{ORG_TYPES[o.type] || o.type}</span><h2 style={{margin: '4px 0', fontSize: '1.5rem'}}>{o.name}</h2><p style={{color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> {o.city} · {o.address}</p></div><span className={`status org-${o.status.toLowerCase()}`} style={{padding: '6px 12px', borderRadius: '20px', fontWeight: 500}}>{label[o.status]}</span></div>{o.rejectionReason&&<div className="form-error" style={{marginBottom: '16px', borderRadius: '8px'}}>{o.rejectionReason}</div>}<div className="admin-stats" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px'}}>

{['HOSPITAL', 'CLINIC'].includes(o.type) && (
  <div className="metric" style={{background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', color: '#0f172a'}}>
    <span style={{color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Uzman Kadrosu</span>
    <strong style={{fontSize: '2rem', color: '#0f172a'}}>{o._count?.doctors||0}</strong>
    <small style={{color: '#64748b'}}>kayıtlı doktor</small>
  </div>
)}

{['HOSPITAL', 'CLINIC', 'IMAGING_CENTER'].includes(o.type) && (
  <div className="metric" style={{background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', color: '#0f172a'}}>
    <span style={{color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Tanımlı Hizmetler</span>
    <strong style={{fontSize: '2rem', color: '#0f172a'}}>{o.services?.length||0}</strong>
    <small style={{color: '#64748b'}}>aktif hizmet / fiyat</small>
  </div>
)}

{o.type === 'PHARMACY' && (
  <>
  <div className="metric" style={{background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', color: '#0f172a'}}>
    <span style={{color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Nöbet Durumu</span>
    <strong style={{fontSize: '1.25rem', color: o.isOnDuty ? '#16a34a' : '#64748b', marginTop: '8px'}}>{o.isOnDuty ? 'Nöbetçi' : 'Kapalı'}</strong>
    <small style={{color: '#64748b'}}>{o.isOnDuty ? 'Aktif yayınlanıyor' : 'Normal mesai'}</small>
  </div>
  <div className="metric" style={{background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', color: '#0f172a'}}>
    <span style={{color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Stok Takibi</span>
    <strong style={{fontSize: '2rem', color: '#0f172a'}}>{o.stocks?.length||0}</strong>
    <small style={{color: '#64748b'}}>kayıtlı ilaç/ürün</small>
  </div>
  </>
)}

{o.type === 'IMAGING_CENTER' && (
  <div className="metric" style={{background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '12px', padding: '16px', color: '#0f172a'}}>
    <span style={{color: '#0284c7', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Dijital İletim</span>
    <strong style={{fontSize: '1.25rem', color: '#0369a1', marginTop: '8px'}}>Aktif</strong>
    <small style={{color: '#0284c7'}}>Radyoloji altyapısı hazır</small>
  </div>
)}

</div><div className="row business-actions" style={{borderTop: '1px solid #f1f5f9', paddingTop: '20px'}}><Link className="primary" href={`/business/${o.id}`} style={{borderRadius: '8px', padding: '10px 24px'}}>Kurumu yönet</Link>{o.status==='APPROVED'&&o.isPublished&&<Link className="secondary" href={`/organizations/${o.slug}`} style={{borderRadius: '8px', padding: '10px 24px'}}>Yayınlanan profili gör</Link>}</div></section>)}</div>}</>}
