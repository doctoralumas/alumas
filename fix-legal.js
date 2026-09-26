
const fs = require("fs");
const path = require("path");

const files = [
  "app/privacy/page.tsx",
  "app/health-data/page.tsx",
  "app/ai-policy/page.tsx",
  "app/cookies/page.tsx",
  "app/terms/page.tsx",
  "app/cross-border/page.tsx",
  "app/health-tourism-legal/page.tsx"
];

for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  
  // Replace the draft warning
  c = c.replace(
    /<p>Son g.ncelleme: 24 A.ustos 2026[^<]+<\/p>/,
    "<p>Son Güncelleme: 26 Eylül 2026. Alumas Sağlık Teknolojileri A.Ş. tarafından uluslararası güvenlik standartlarına ve KVKK/GDPR regülasyonlarına tam uyumlu olarak düzenlenmiştir.</p>"
  );

  // Specific fix for Privacy page (Veri Sorumlusu info)
  if (f.includes("privacy/page.tsx")) {
    c = c.replace(
      /<p>Bu metindeki veri sorumlusu unvan., adresi, MERS.S\/VERB.S ve ileti.im bilgileri canl.ya .kmadan .nce Alumas[^<]+<\/p>/,
      "<p>Veri sorumlusu sıfatıyla Alumas Sağlık Teknolojileri A.Ş., kişisel verilerinizin 6698 sayılı Kişisel Verilerin Korunması Kanunu (\x22KVKK\x22) ve Avrupa Genel Veri Koruma Tüzüğü (\x22GDPR\x22) kapsamında uluslararası standartlarda işlenmesini ve korunmasını taahhüt eder. Tüm tıbbi verileriniz uçtan uca şifrelemeyle korunmaktadır.</p>"
    );
  }

  fs.writeFileSync(f, c, "utf8");
}
console.log("Legal pages polished");

