import fs from 'node:fs';
const schema=fs.readFileSync('prisma/schema.prisma','utf8');
for(const token of ['model ChildGrowthRecord','model PregnancyEvent','model HealthSummaryShare','VACCINATION','PREGNANCY'])if(!schema.includes(token))throw new Error('Şemada eksik: '+token);
for(const f of ['app/health/family/page.tsx','app/api/health/growth/route.ts','app/api/health/pregnancy-events/route.ts','app/api/health/summary-shares/route.ts','components/health-summary-sharing.tsx'])if(!fs.existsSync(f))throw new Error('Eksik: '+f);
const calendar=fs.readFileSync('app/api/calendar/route.ts','utf8');if(!calendar.includes('vaccinations')||!calendar.includes('pregnancyEvents'))throw new Error('Takvim v21 akışı eksik');
const vaccine=fs.readFileSync('app/api/health/vaccinations/route.ts','utf8');if(!vaccine.includes('VACCINATION'))throw new Error('Aşı hatırlatıcısı eksik');
const doctor=fs.readFileSync('app/doctor/patients/[id]/page.tsx','utf8');if(!doctor.includes('summaryShare'))throw new Error('Doktor özet paylaşımı eksik');
console.log('v21 flow check OK');
