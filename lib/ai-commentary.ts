import type {NavigationIntent} from "@/lib/ai-navigation";

export function navigationCommentary(intent: NavigationIntent, counts: {doctors:number;organizations:number}) {
  if (intent.triage === "emergency") {
    return "İfadenizde acil değerlendirme gerektirebilecek bir sinyal bulunduğu için normal doktor sıralamasını geri plana aldım ve acil erişimi öne çıkardım. Bu bir tanı değildir.";
  }
  if (intent.triage === "urgent") {
    return "İfadenizde gecikmeden değerlendirilmesi uygun olabilecek bir sinyal bulundu. Bu nedenle sonuçları hız ve erişilebilirliği önemseyerek sunuyorum; kesin tıbbi değerlendirme yapmıyorum.";
  }
  if (intent.specialty) {
    const total = counts.doctors + counts.organizations;
    return `Yazdığınız ifadede ${intent.specialty} ile ilişkili yönlendirme sinyalleri bulundu. ${total > 0 ? `Bu nedenle ${total} doğrulanmış eşleşmeyi öne çıkardım.` : "Doğrulanmış eşleşme bulamadığım için sonucu genişletmenizi öneriyorum."} Bu yorum yalnız sağlık hizmetine yönlendirme içindir.`;
  }
  if (intent.facility === "PHARMACY") return "İsteğiniz bir eczane ihtiyacını işaret ettiği için doktor yorumu üretmeden doğrulanmış eczane sonuçlarına odaklanıyorum.";
  if (intent.facility === "LAB") return "İsteğiniz laboratuvar/tahlil hizmetiyle ilişkili olduğu için doğrulanmış tanı hizmeti sağlayıcılarını öne çıkarıyorum.";
  return "İfadenizde güvenilir bir branş veya hizmet eşleşmesi oluşturacak kadar belirgin bilgi yok. Yanlış yönlendirmemek için ek bilgi istiyorum.";
}

export const mandatoryHealthDisclaimer = "Ben sağlık profesyoneli değilim. Bu yanıt tanı, tedavi veya reçete yerine geçmez; amacı uygun sağlık hizmetine yönlendirmeyi kolaylaştırmaktır.";
