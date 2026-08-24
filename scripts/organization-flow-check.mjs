import {readFileSync,existsSync} from 'node:fs';
const required=['app/api/organizations/route.ts','app/api/organizations/me/route.ts','app/api/admin/organizations/route.ts','app/api/admin/organizations/[id]/route.ts','app/organizations/page.tsx','app/business/apply/page.tsx','app/business/page.tsx','app/admin/organizations/page.tsx'];
for(const f of required) if(!existsSync(f)) throw new Error(`Eksik: ${f}`);
const schema=readFileSync('prisma/schema.prisma','utf8');
for(const t of ['model Organization {','model OrganizationService {','model PharmacyStock {']) if(!schema.includes(t)) throw new Error(`Şema eksik: ${t}`);
console.log('organization flow source check: OK');
