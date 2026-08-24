import fs from 'node:fs';
const required=['prisma/schema.prisma','app/health/summary/page.tsx','app/health/vaccinations/page.tsx','app/health/allergies/page.tsx','app/health/medical-history/page.tsx','app/health/family-profiles/page.tsx','app/api/health/summary/route.ts','app/api/health/vaccinations/route.ts','app/api/health/allergies/route.ts','app/api/health/history/route.ts','app/api/health/special-profiles/route.ts'];
for(const f of required){if(!fs.existsSync(f))throw new Error('Eksik: '+f)}
const schema=fs.readFileSync('prisma/schema.prisma','utf8');for(const m of ['VaccinationRecord','AllergyRecord','MedicalCondition','ProcedureHistory','SpecialHealthProfile'])if(!schema.includes('model '+m))throw new Error('Model eksik '+m);
const health=fs.readFileSync('app/health/page.tsx','utf8');for(const r of ['/health/summary','/health/vaccinations','/health/allergies','/health/medical-history','/health/family-profiles'])if(!health.includes(r))throw new Error('Health link eksik '+r);
console.log('Alumas v20 flow check OK');
