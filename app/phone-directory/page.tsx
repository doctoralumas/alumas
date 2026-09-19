import SectionVisual from "@/components/section-visual";
import HealthPhoneDirectory from '@/components/health-phone-directory';

import { currentUser } from '@/lib/auth';
export default async function Page(){
  const user = await currentUser();
  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <SectionVisual slug="phone-directory" alt="Telefon Rehberi" />
      
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "0 0 12px", fontWeight: 700 }}>Sağlık Rehberi</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", lineHeight: "1.5" }}>
          Sık görüştüğünüz doktorlar, kurumlar ve acil numaralar. Tek tıkla arayın, favorilerinize ekleyin.
        </p>
      </div>
      
      <HealthPhoneDirectory isLoggedIn={!!user} />
    </div>
  )
}