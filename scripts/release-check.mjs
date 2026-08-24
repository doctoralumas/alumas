import fs from 'node:fs';
const errors=[];
const requiredFiles=['capacitor.config.ts','MOBILE_RELEASE.md','PRODUCTION_RELEASE.md','store/app-store.tr-TR.json','store/google-play.tr-TR.json','public/privacy-policy.html'];
for (const f of requiredFiles) if (!fs.existsSync(f)) errors.push(`Eksik dosya: ${f}`);
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version||'')) errors.push('package.json version semver olmalı.');
const cap=fs.readFileSync('capacitor.config.ts','utf8');
if (!cap.includes("appId: 'com.alumas.health'")) errors.push('Beklenen bundle/application id bulunamadı.');
if (errors.length){errors.forEach(e=>console.error('ERROR:',e));process.exit(1)}
console.log(`OK: Alumas ${pkg.version} release dosyaları hazır.`);
console.log('Not: Kod imzalama, Apple/Google hesapları, gerçek secrets ve fiziksel cihaz testi ayrıca gereklidir.');
