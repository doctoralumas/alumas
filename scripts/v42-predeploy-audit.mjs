import fs from "node:fs";
const exists=p=>fs.existsSync(p);
const requiredFiles=["package.json","prisma/schema.prisma","app/page.tsx","app/api/auth/register/route.ts","app/api/health/cycle/route.ts","app/api/appointments/route.ts","app/api/places/nearby/route.ts"];
let fail=false;
for(const f of requiredFiles){if(!exists(f)){console.error("MISSING",f);fail=true}}
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.scripts?.postinstall!=="prisma generate"){console.error("MISSING postinstall prisma generate");fail=true}
const warnings=[];
if((process.env.STORAGE_DRIVER||"local")==="local") warnings.push("Vercel'de local storage kalıcı değildir; STORAGE_DRIVER=s3 kullan.");
if(!process.env.DATABASE_URL) warnings.push("DATABASE_URL bağlı değil.");
if(!process.env.GOOGLE_PLACES_API_KEY) warnings.push("Google Places canlı sonuçları kapalı.");
if((process.env.SMS_PROVIDER||"console")==="console") warnings.push("SMS console modunda; gerçek OTP SMS gönderilmez.");
if((process.env.VIDEO_PROVIDER||"demo")==="demo") warnings.push("Video görüşme demo modunda.");
if(!process.env.FIREBASE_PROJECT_ID) warnings.push("FCM push bağlı değil.");
console.log("v42 predeploy source checks OK");
for(const w of warnings) console.warn("WARN:",w);
if(fail) process.exit(1);
