import SectionVisual from "@/components/section-visual";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import { Star, MapPin, Stethoscope, CaretRight, Info, VideoCamera, ChatCircleText, CalendarPlus } from "@phosphor-icons/react/dist/ssr";

export default async function Page({searchParams}:{searchParams:Promise<{profileId?:string}>}) {
  const {profileId}=await searchParams;
  const doctors=await prisma.doctor.findMany({
    where:{isVerified:true,isPublished:true},
    select:{id:true,slug:true,name:true,specialty:true,presenceStatus:true,city:true,reviewCount:true,rating:true},
    orderBy:[{rating:'desc'},{name:'asc'}],
    take:60
  });

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#dcfce7', text: '#16a34a', label: 'Müsait', dot: '#22c55e' };
      case 'ONLINE': return { bg: '#e0f2fe', text: '#0284c7', label: 'Çevrimiçi', dot: '#0ea5e9' };
      case 'BUSY': return { bg: '#fee2e2', text: '#dc2626', label: 'Meşgul', dot: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b', label: 'Çevrimdışı', dot: '#94a3b8' };
    }
  };

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="doctors" alt="Uzmanlar" />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker">Tıbbi Kadro</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>
            {profileId ? 'Aile profili için uzman seç' : 'Doktorlar & Uzmanlar'}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            {profileId ? 'Seçeceğin randevu aile profilinin sağlık planına bağlanacak.' : 'Kendi alanında uzmanlaşmış deneyimli hekimler, diyetisyenler ve fizyoterapistler.'}
          </p>
        </div>
      </div>

      {profileId && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "16px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px", color: "#16a34a" }}>
          <Info size={24} weight="duotone" />
          <span style={{ fontWeight: 500 }}>Aile profili bağlantısı aktif. Seçeceğiniz uzmandan alınacak randevu doğrudan bu profile kaydedilecektir.</span>
        </div>
      )}

      {/* Doktorlar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        {doctors.map(d => {
          const presence = getPresenceColor(d.presenceStatus);
          return (
            <Link key={d.id} href={`/doctors/${d.slug}${profileId ? `?profileId=${profileId}` : ''}`} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", textDecoration: "none", color: "inherit", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "20px" }} className="hover-shadow">
              
              {/* Profil Header */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "#475569", border: "1px solid #cbd5e1" }}>
                    {d.name.split(' ').slice(-2).map(x => x[0]).join('')}
                  </div>
                  <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "16px", height: "16px", background: presence.dot, borderRadius: "50%", border: "3px solid #fff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                    {d.name}
                  </h3>
                  <div style={{ color: "#4f46e5", fontSize: "14px", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Stethoscope size={16} /> {d.specialty}
                  </div>
                </div>
              </div>

              {/* Lokasyon ve Puan */}
              <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "16px" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
                  <MapPin size={16} /> {d.city}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontSize: "13px", fontWeight: 700 }}>
                  <Star size={16} weight="fill" />
                  {d.reviewCount > 0 ? (
                    <>{d.rating.toFixed(1)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({d.reviewCount})</span></>
                  ) : (
                    <span style={{ color: "#64748b" }}>Yeni</span>
                  )}
                </div>
              </div>

              {/* Footer Aksiyonlar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px dashed #e2e8f0", paddingTop: "20px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}><VideoCamera size={18} /></div>
                  <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}><ChatCircleText size={18} /></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600 }}>
                  Randevu <CaretRight size={14} weight="bold" />
                </div>
              </div>
            </Link>
          );
        })}
        {doctors.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", color: "#64748b" }}>
            Şu anda aktif doktor bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
