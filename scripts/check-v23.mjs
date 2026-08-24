import fs from 'node:fs';import path from 'node:path';
const req={
 'prisma/schema.prisma':['model FamilyProfileInvite','model FamilyProfileAccess','sentFamilyInvites','sharedAccess'],
 'app/api/health/family-access/invites/route.ts':['permissions','notifyUser','expiresAt'],
 'app/api/health/family-access/invites/[id]/route.ts':['accept','reject','revoke','familyProfileAccess.upsert'],
 'app/api/health/family-access/route.ts':['granted','owned','isActive'],
 'lib/family-access.ts':['familyProfilePermission'],
 'app/health/family-access/page.tsx':['Aile erişimi','Davet gönder','Gelen davetler'],
 'app/api/health/family-tasks/route.ts':['familyProfilePermission','REMINDERS'],
 'app/api/health/growth/route.ts':['familyProfilePermission','GROWTH']
};
for(const [f,needles] of Object.entries(req)){if(!fs.existsSync(f))throw new Error('Eksik dosya: '+f);const s=fs.readFileSync(f,'utf8');for(const n of needles)if(!s.includes(n))throw new Error(`${f} eksik: ${n}`)}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));if(pkg.version!=='0.23.0')throw new Error('package version 0.23.0 değil');console.log('v23 family access flow check: OK');
