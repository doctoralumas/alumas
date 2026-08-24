import LiveHealthResults from "@/components/ai/LiveHealthResults";
import HealthNavigator from "@/components/ai/health-navigator";
import Link from "next/link";

export default function AiPage(){
  return <div className="page ai-page">
    <HealthNavigator/>
    <section className="ai-trust-grid">
      <article><b>Kaynağı görünür cevap</b><span>Her sonuçta kullanılan veri kaynakları ve yönlendirme nedeni gösterilir.</span></article>
      <article><b>Doğrulanmış profiller</b><span>Doktor ve kurum önerileri yalnız doğrulanmış, yayınlanmış Alumas kayıtlarından gelir.</span></article>
      <article><b>Güvenli yorum</b><span>Ajan neden bu yönlendirmeyi yaptığını açıklar; tanı veya tedavi üretmez.</span></article>
      <article><b>Sabit güvenlik uyarısı</b><span>Her yanıt “Ben sağlık profesyoneli değilim.” ifadesiyle güvenlik sınırını açıkça belirtir.</span></article>
    </section>
    <div className="ai-page-footer"><Link href="/services">Tüm hizmetleri görüntüle</Link><Link href="/emergency">Acil / 112</Link></div>
  </div>
}

// v48: AI doctor match engine available at /api/ai/matches with explainable scoring.
