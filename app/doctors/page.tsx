import SectionVisual from "@/components/section-visual";
import {prisma} from "@/lib/prisma";
import { Info } from "@phosphor-icons/react/dist/ssr";
import DoctorClientList from "@/components/doctor-client-list";

export default async function Page({searchParams}:{searchParams:Promise<{profileId?:string}>}) {
  const {profileId}=await searchParams;
  const doctors=await prisma.doctor.findMany({
    where:{isVerified:true,isPublished:true},
    select:{id:true,slug:true,name:true,specialty:true,presenceStatus:true,city:true,reviewCount:true,rating:true},
    orderBy:[{rating:'desc'},{name:'asc'}],
    take:60
  });

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

      {/* Doktorlar Client Grid (Arama & Filtreleme) */}
      <DoctorClientList doctors={doctors} profileId={profileId} />
    </div>
  );
}
