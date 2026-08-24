import type {NavigationIntent} from "@/lib/ai-navigation";

export type MedicalEvidence = {
  id: string;
  publisher: "T.C. Sağlık Bakanlığı" | "World Health Organization" | "NHS";
  title: string;
  url: string;
  topic: "emergency" | "self_care" | "chest_pain" | "navigation";
  statement: string;
  reviewedAt: string;
  priority: number;
};

// Version-controlled, short paraphrases only. We do not scrape or reproduce source pages at runtime.
// Each statement must be manually reviewed before production promotion.
export const MEDICAL_EVIDENCE: MedicalEvidence[] = [
  {
    id: "tr-moh-112-emergency",
    publisher: "T.C. Sağlık Bakanlığı",
    title: "112 Acil Sağlık Hizmetleri",
    url: "https://istanbul.saglik.gov.tr/TR-56073/112-acil-saglik-hizmetleri.html",
    topic: "emergency",
    statement: "Hayati tehlike oluşturan durumlarda 112 acil sağlık hizmetine başvurulmalıdır. Sağlık Bakanlığı örnekler arasında bilinç kaybı, ciddi kanama, göğüs ağrısı ve nefes alma güçlüğünü sayar.",
    reviewedAt: "2026-08-24",
    priority: 100,
  },
  {
    id: "who-self-care",
    publisher: "World Health Organization",
    title: "Self-care for health and well-being",
    url: "https://www.who.int/news-room/questions-and-answers/item/self-care-for-health-and-well-being",
    topic: "self_care",
    statement: "WHO, öz-bakımın sağlık sistemi ve sağlık çalışanlarının yerini almadığını; onları tamamlayan bir yaklaşım olduğunu belirtir.",
    reviewedAt: "2026-08-24",
    priority: 90,
  },
  {
    id: "nhs-chest-pain",
    publisher: "NHS",
    title: "Chest pain",
    url: "https://www.nhs.uk/symptoms/chest-pain/",
    topic: "chest_pain",
    statement: "NHS, geçmeyen ani göğüs ağrısı veya göğüs ağrısına nefes darlığı, terleme, bulantı ya da sersemlik eşlik etmesi gibi durumlarda acil yardım alınmasını önerir.",
    reviewedAt: "2026-08-24",
    priority: 80,
  },
];

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function evidenceFor(message: string, intent: NavigationIntent): MedicalEvidence[] {
  const text = normalize(message);
  const topics = new Set<MedicalEvidence["topic"]>();

  // Every health-navigation answer carries the self-care boundary evidence.
  topics.add("self_care");
  if (intent.triage === "emergency" || intent.triage === "urgent") topics.add("emergency");
  if (text.includes("gogus") || text.includes("chest") || text.includes("kalp krizi")) topics.add("chest_pain");

  return MEDICAL_EVIDENCE
    .filter((item) => topics.has(item.topic))
    .sort((a,b) => b.priority-a.priority)
    .slice(0,3);
}

export function evidenceBasedCommentary(
  intent: NavigationIntent,
  evidence: MedicalEvidence[],
  counts: {doctors:number;organizations:number}
) {
  const boundary = "Ben sağlık profesyoneli değilim.";

  if (intent.triage === "emergency") {
    return `${boundary} Yazdığınız ifadede acil değerlendirme gerektirebilecek bir sinyal bulundu. T.C. Sağlık Bakanlığı'nın 112 bilgilendirmesi hayati tehlike, göğüs ağrısı, ciddi kanama ve nefes alma güçlüğü gibi durumlarda 112'ye başvurulmasını belirtir. Bu nedenle normal doktor sıralamasını geri plana alıp acil erişimi öne çıkarıyorum.`;
  }
  if (intent.triage === "urgent") {
    return `${boundary} Yazdığınız ifade gecikmeden profesyonel değerlendirme gerektirebilecek bir sinyal içeriyor. Bu nedenle hız ve erişilebilirliği öne çıkarıyorum. Kesin tanı veya tedavi yorumu yapmıyorum.`;
  }
  if (intent.specialty) {
    const total = counts.doctors + counts.organizations;
    return `${boundary} İfadenizde ${intent.specialty} ile ilişkili yönlendirme sinyalleri bulundu. ${total > 0 ? `${total} doğrulanmış Alumas eşleşmesini öne çıkardım.` : "Doğrulanmış eşleşme bulamadım; daha fazla konum veya belirti bilgisi istemek daha güvenli."} WHO'nun yaklaşımına uygun olarak bu bilgi profesyonel sağlık değerlendirmesinin yerine geçmez.`;
  }
  if (intent.facility === "PHARMACY") return `${boundary} İsteğiniz eczane erişimiyle ilgili görünüyor; tıbbi yorum üretmeden doğrulanmış eczane seçeneklerine odaklanıyorum.`;
  if (intent.facility === "LAB") return `${boundary} İsteğiniz laboratuvar/tahlil hizmetiyle ilgili görünüyor; sonuçları yorumlamak yerine doğrulanmış hizmet sağlayıcılarını bulmaya odaklanıyorum.`;
  return `${boundary} Güvenilir bir branş eşleşmesi oluşturmak için yeterli bilgi yok. Yanlış yönlendirmemek için daha fazla belirti, süre ve konum bilgisi istemek daha güvenli.`;
}
