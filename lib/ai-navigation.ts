export type TriageLevel = "routine" | "urgent" | "emergency";

export type NavigationIntent = {
  triage: TriageLevel;
  specialty: string | null;
  facility: "DOCTOR" | "HOSPITAL" | "CLINIC" | "PHARMACY" | "LAB" | null;
  locationHint: string | null;
  confidence: number;
  reasons: string[];
  followUpQuestion: string | null;
};

const normalize = (value: string) => value
  .toLocaleLowerCase("tr-TR")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

const hasAny = (text: string, words: string[]) => words.some((word) => text.includes(normalize(word)));

const emergencyPatterns = [
  "nefes alamıyorum", "nefes alamiyor", "bilincini kaybetti", "bilinç kaybı", "bilinc kaybi",
  "şiddetli kanama", "siddetli kanama", "yüzü kaydı", "yuzu kaydi", "kolunu kaldıramıyor",
  "kolunu kaldiramiyor", "konuşamıyor", "konusamiyor", "morardı", "morardi", "boğuluyor",
  "boguluyor", "nöbet geçiriyor", "nobet geciriyor", "intihar etmek istiyorum", "kendime zarar"
];

const urgentPatterns = [
  "göğüs ağrısı", "gogus agrisi", "40 derece", "çok yüksek ateş", "cok yuksek ates",
  "ani şiddetli baş ağrısı", "ani siddetli bas agrisi", "bayıldım", "bayildim",
  "kan kusma", "siyah dışkı", "siyah diski"
];

const specialtyRules: Array<{specialty: string; keywords: string[]}> = [
  {specialty: "Ortopedi ve Travmatoloji", keywords:["diz", "omuz", "kalça", "kalca", "ayak bileği", "ayak bilegi", "kırık", "kirik", "burkulma", "eklem ağrısı", "eklem agrisi"]},
  {specialty: "Kardiyoloji", keywords:["çarpıntı", "carpinti", "tansiyon", "kalp", "ritim"]},
  {specialty: "Nöroloji", keywords:["baş ağrısı", "bas agrisi", "migren", "baş dönmesi", "bas donmesi", "uyuşma", "uyusma"]},
  {specialty: "Dermatoloji", keywords:["cilt", "döküntü", "dokuntu", "kaşıntı", "kasinti", "sivilce", "saç dökülmesi", "sac dokulmesi"]},
  {specialty: "Kulak Burun Boğaz", keywords:["kulak", "boğaz", "bogaz", "burun", "sinüzit", "sinuzit", "işitme", "isitme"]},
  {specialty: "Göz Hastalıkları", keywords:["göz", "goz", "görme", "gorme", "göz ağrısı", "goz agrisi"]},
  {specialty: "Kadın Hastalıkları ve Doğum", keywords:["regl", "adet", "gebelik", "hamile", "vajinal", "kadın doğum", "kadin dogum"]},
  {specialty: "Çocuk Sağlığı ve Hastalıkları", keywords:["çocuğum", "cocugum", "çocuk", "cocuk", "bebeğim", "bebegim", "bebek"]},
  {specialty: "Gastroenteroloji", keywords:["mide", "reflü", "reflu", "bağırsak", "bagirsak", "karın ağrısı", "karin agrisi"]},
  {specialty: "Göğüs Hastalıkları", keywords:["öksürük", "oksuruk", "astım", "astim", "balgam"]},
  {specialty: "Diş Hekimliği", keywords:["diş", "dis", "dişim", "disim", "diş eti", "dis eti"]},
  {specialty: "İç Hastalıkları", keywords:["halsizlik", "şeker", "seker", "kolesterol", "genel kontrol", "check up"]},
];

const locationNames = [
  "Ataşehir", "Kadıköy", "Üsküdar", "Beşiktaş", "Şişli", "Bakırköy", "Maltepe", "Kartal",
  "Pendik", "Sarıyer", "Beykoz", "Ümraniye", "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"
];

export function analyzeNavigationIntent(message: string): NavigationIntent {
  const text = normalize(message.slice(0, 1200));
  const reasons: string[] = [];

  let triage: TriageLevel = "routine";
  if (hasAny(text, emergencyPatterns)) {
    triage = "emergency";
    reasons.push("Acil değerlendirme gerektirebilecek ifade algılandı.");
  } else if (hasAny(text, urgentPatterns)) {
    triage = "urgent";
    reasons.push("Gecikmeden sağlık değerlendirmesi gerektirebilecek ifade algılandı.");
  }

  let facility: NavigationIntent["facility"] = null;
  if (hasAny(text,["eczane", "ilaç bul", "ilac bul"])) facility = "PHARMACY";
  else if (hasAny(text,["laboratuvar", "tahlil", "kan tahlili"])) facility = "LAB";
  else if (hasAny(text,["hastane", "acil servis"])) facility = "HOSPITAL";
  else if (hasAny(text,["klinik"])) facility = "CLINIC";

  let specialty: string | null = null;
  let matchScore = 0;
  for (const rule of specialtyRules) {
    const score = rule.keywords.filter((keyword) => text.includes(normalize(keyword))).length;
    if (score > matchScore) {
      specialty = rule.specialty;
      matchScore = score;
    }
  }
  if (specialty) reasons.push(`Şikâyet ifadesi ${specialty} branşıyla eşleşti.`);

  const locationHint = locationNames.find((name) => text.includes(normalize(name))) || null;
  if (locationHint) reasons.push(`Konum ipucu: ${locationHint}.`);

  if (!facility && specialty) facility = "DOCTOR";

  const signalCount = Number(Boolean(specialty)) + Number(Boolean(facility)) + Number(Boolean(locationHint));
  const confidence = Math.min(0.94, 0.48 + (matchScore * 0.16) + (signalCount * 0.06));
  const followUpQuestion = specialty || facility
    ? null
    : "Şikâyetinizi, ne kadar süredir devam ettiğini ve mümkünse bulunduğunuz ilçeyi biraz daha ayrıntılı yazar mısınız?";

  return {triage, specialty, facility, locationHint, confidence, reasons, followUpQuestion};
}

export function navigationSummary(intent: NavigationIntent) {
  if (intent.triage === "emergency") {
    return "Anlattığınız durum acil değerlendirme gerektirebilir. Uygun doktor araması yerine acil sağlık hizmetine hızlı erişimi önceliklendiriyorum.";
  }
  if (intent.triage === "urgent") {
    return "Anlattığınız durum gecikmeden değerlendirilmesi gereken belirtiler içerebilir. En kısa sürede sağlık kuruluşuna başvurmanız uygun olur.";
  }
  if (intent.specialty) {
    return `Bu şikâyet için ${intent.specialty} uygun bir başlangıç branşı olabilir. Aşağıdaki sonuçlar yalnız doğrulanmış Alumas profillerinden getiriliyor.`;
  }
  if (intent.facility === "PHARMACY") return "Yakınınızdaki doğrulanmış eczane seçeneklerini bulmaya çalışıyorum.";
  if (intent.facility === "LAB") return "Yakınınızdaki laboratuvar ve tanı hizmetlerini bulmaya çalışıyorum.";
  return "İhtiyacınızı doğru sağlık hizmetine yönlendirmek için birkaç ek bilgiye ihtiyacım var.";
}
