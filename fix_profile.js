const fs = require('fs');

const code = \
import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import OrganizationMap from '@/components/organization-map';
import OrganizationBooking from '@/components/organization-booking';
import {FavoriteOrganization,OrganizationReviews} from '@/components/organization-actions';
import OrganizationOfferings from '@/components/organization-offerings';
import {currentUser} from '@/lib/auth';
import { MapPin, Phone, Globe, Star, Clock, Info, Heartbeat, Pill, Flask, FirstAid, ListDashes, CheckCircle, Warning, ChatCircle } from "@phosphor-icons/react/dist/ssr";

const labels:any={HOSPITAL:'Hastane',CLINIC:'Klinik',PHARMACY:'Eczane',IMAGING_CENTER:'Görüntüleme Merkezi',LABORATORY:'Týbbi Laboratuvar'};
const days=['Pazar','Pazartesi','Salý','Çarþamba','Perþembe','Cuma','Cumartesi'];

export default async function OrganizationProfile({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const o=await prisma.organization.findFirst({
    where:{
      slug,
      status:'APPROVED',
      isPublished:true,
      verificationDocuments:{none:{status:"APPROVED",expiresAt:{lt:new Date()}}}
    },
    include:{
      services:{where:{isActive:true},include:{variants:{where:{isActive:true},orderBy:{createdAt:"asc"}}},orderBy:{name:'asc'}},
      hours:{orderBy:{weekday:'asc'}},
      departments:{where:{isActive:true},orderBy:{name:'asc'}},
      campaigns:{where:{isActive:true},orderBy:{createdAt:'desc'}},
      emergencyServices:{where:{isActive:true},orderBy:{name:"asc"}},
      doctors:{orderBy:{rating:'desc'}},
      imagingExams:{where:{isActive:true},orderBy:[{modality:'asc'},{name:'asc'}]},
      laboratoryTests:{where:{isActive:true},orderBy:[{category:'asc'},{name:'asc'}]},
      stocks:{take:20,orderBy:{updatedAt:'desc'}},
      reviews:{where:{status:'APPROVED'},select:{rating:true}}
    }
  });

  if(!o) notFound();
  const u=await currentUser();
  const avg=o.reviews.length?(o.reviews.reduce((a,b)=>a+b.rating,0)/o.reviews.length).toFixed(1):null;

  return (
    <div className="page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      
      {/* PREMIUM HERO SECTION */}
      <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
        
        {/* Map Header */}
        <div style={{ height: '300px', width: '100%', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
          <OrganizationMap lat={o.latitude} lng={o.longitude} name={o.name} address={o.address}/>
        </div>

        {/* Profile Info Row */}
        <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', flex: 1 }}>
            
            {/* Logo */}
            <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: '#3b82f6', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              {labels[o.type]?.[0] || 'A'}
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={16} weight="fill" />
                  Doðrulanmýþ {labels[o.type]}
                </span>
                {o.isOnDuty && (
                  <span style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Warning size={16} weight="fill" />
                    Þu An Nöbetçi
                  </span>
                )}
              </div>
              <h1 style={{ margin: '0 0 12px 0', fontSize: '32px', color: '#0f172a', fontWeight: 800 }}>{o.name}</h1>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#64748b', fontSize: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={18} /> {o.city}{o.district? \ • \\:''} • {o.address}</span>
                {o.phone && <a href={\	el:\\} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none' }}><Phone size={18} /> {o.phone}</a>}
                {o.website && <a href={o.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', textDecoration: 'none' }}><Globe size={18} /> Web sitesi</a>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', minWidth: '200px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FavoriteOrganization id={o.id}/>
              {u && u.id !== o.ownerUserId && (
                <a href={\/messages?userId=\\} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px' }}>
                  <ChatCircle size={20} /> Mesaj
                </a>
              )}
            </div>
            {avg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fffbeb', padding: '8px 16px', borderRadius: '100px', color: '#b45309', fontWeight: 700 }}>
                <Star size={18} weight="fill" color="#f59e0b" /> {avg} ({o.reviews.length} deðerlendirme)
              </div>
            )}
          </div>
        </div>
      </div>

      {o.type !== 'PHARMACY' && o.doctors.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <OrganizationBooking organizationId={o.id}/>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column (About & Hours) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}><Info size={24} color="#64748b" weight="duotone" /></div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Hakkýnda</h2>
            </div>
            <div style={{ padding: '24px', color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
              {o.description || 'Kurum açýklamasý henüz eklenmedi.'}
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}><Clock size={24} color="#64748b" weight="duotone" /></div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Çalýþma Saatleri</h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {days.map((d,i) => {
                const h = o.hours.find(x => x.weekday === i);
                const isClosed = !h || h.isClosed;
                return (
                  <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: i !== 6 ? '1px dashed #e2e8f0' : 'none' }}>
                    <b style={{ color: isClosed ? '#94a3b8' : '#0f172a', fontWeight: 600 }}>{d}</b>
                    <span style={{ 
                      background: isClosed ? '#f1f5f9' : '#f0fdf4', 
                      color: isClosed ? '#64748b' : '#16a34a', 
                      padding: '4px 12px', 
                      borderRadius: '100px', 
                      fontSize: '14px', 
                      fontWeight: 600 
                    }}>
                      {isClosed ? 'Kapalý' : \\ – \\}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eczane Nöbet Bilgisi */}
          {o.type === 'PHARMACY' && o.isOnDuty && (
            <div style={{ background: '#fef2f2', borderRadius: '24px', border: '1px solid #fecaca', overflow: 'hidden', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#ef4444', color: 'white', padding: '12px', borderRadius: '14px' }}>
                  <FirstAid size={28} weight="duotone" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#991b1b', fontSize: '18px' }}>Þu an nöbetçi eczane!</h3>
                  <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '14px' }}>
                    {o.onDutyUntil ? \Bu eczane \ tarihine kadar nöbetçi.\ : 'Bu eczane sistemde nöbetçi olarak kayýtlý.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Offerings, Services, Departments) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <OrganizationOfferings type={o.type} services={o.services} imagingExams={o.imagingExams} laboratoryTests={o.laboratoryTests} />

          {/* Pharmacy Stocks */}
          {o.type === 'PHARMACY' && (
            <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}><Pill size={24} color="#3b82f6" weight="duotone" /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Eczane Stok Durumu</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Stok durumu eczane tarafýndan güncellenir; gitmeden önce teyit edin.</p>
                </div>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {o.stocks.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', margin: '20px 0' }}>Stok bilgisi bulunmuyor.</p>}
                {o.stocks.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <b style={{ color: '#0f172a', fontSize: '16px' }}>{s.itemName}</b>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 700,
                      background: s.stockStatus === 'in_stock' ? '#f0fdf4' : s.stockStatus === 'limited' ? '#fffbeb' : '#fef2f2',
                      color: s.stockStatus === 'in_stock' ? '#16a34a' : s.stockStatus === 'limited' ? '#d97706' : '#dc2626'
                    }}>
                      {s.stockStatus === 'in_stock' ? 'Stokta var' : s.stockStatus === 'limited' ? 'Sýnýrlý Stok' : 'Tükendi'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Services */}
          {o.type === 'HOSPITAL' && o.emergencyServices.length > 0 && (
            <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '12px' }}><Heartbeat size={24} color="#ef4444" weight="duotone" /></div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Acil Hizmetler</h2>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {o.emergencyServices.map((e:any) => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <b style={{ display: 'block', color: '#0f172a', fontSize: '16px' }}>{e.name}</b>
                      <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        {e.kind} {e.is24Hours ? " • 7/24 Hizmet" : ""}
                        {e.description && <span style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}>{e.description}</span>}
                      </div>
                    </div>
                    {e.phone && <a href={\	el:\\} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Ara</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          {o.type === 'HOSPITAL' && o.departments.length > 0 && (
            <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '12px' }}><ListDashes size={24} color="#9333ea" weight="duotone" /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Departmanlar</h2>
                </div>
              </div>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {o.departments.map(dep => (
                  <div key={dep.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>{dep.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{dep.description || 'Kurum departmaný'}</p>
                    <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', display: 'inline-block', padding: '4px 8px', borderRadius: '6px' }}>
                      {o.doctors.filter(d => d.departmentId === dep.id).length} uzman
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Campaigns */}
      {o.campaigns.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Güncel Kampanyalar</h2>
            <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {o.campaigns.map(c => (
              <div key={c.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '64px', opacity: 0.1 }}>??</div>
                <h3 style={{ margin: '0 0 12px', fontSize: '20px', color: '#92400e', position: 'relative' }}>{c.title}</h3>
                <p style={{ margin: 0, color: '#b45309', fontSize: '15px', position: 'relative' }}>{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctors */}
      {o.doctors.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Bu Kurumda Çalýþan Uzmanlar</h2>
            <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {o.doctors.map(d => (
              <a key={d.id} href={\/doctors/\\} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 }}>
                  {d.name.split(' ').slice(-2).map(x => x[0]).join('')}
                </div>
                <div>
                  <b style={{ display: 'block', color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>{d.name}</b>
                  <span style={{ color: '#64748b', fontSize: '14px', display: 'block' }}>
                    {d.specialty}{o.type === 'HOSPITAL' && d.departmentId ? \ · \\ : ''}
                  </span>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} weight="fill" /> {d.rating}</span>
                    <span style={{ color: '#16a34a' }}>{d.nextSlot || 'Müsait'}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div style={{ marginTop: '48px' }}>
        <OrganizationReviews id={o.id}/>
      </div>
      
    </div>
  );
}
\

fs.writeFileSync('app/organizations/[slug]/page.tsx', code);
