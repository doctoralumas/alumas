import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();const must=[
'components/interactive-organization-map.tsx','components/doctor-actions.tsx','components/favorite-doctors.tsx','components/admin-review-moderation.tsx','components/doctor-completion-list.tsx','app/health-circle/page.tsx','app/admin/reviews/page.tsx','app/api/admin/reviews/route.ts','app/api/cron/appointments/route.ts','app/api/doctors/[id]/favorite/route.ts','app/api/doctors/[id]/reviews/route.ts','app/api/doctors/favorites/route.ts','V13_HEALTH_NETWORK.md'];
let ok=true;for(const f of must){if(!fs.existsSync(path.join(root,f))){console.error('MISSING',f);ok=false}}
const schema=fs.readFileSync(path.join(root,'prisma/schema.prisma'),'utf8');for(const token of ['model DoctorFavorite','model DoctorReview','enum ReviewStatus','reviewRequestedAt'])if(!schema.includes(token)){console.error('SCHEMA_MISSING',token);ok=false}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));if(!pkg.dependencies?.['mapbox-gl']){console.error('DEPENDENCY_MISSING mapbox-gl');ok=false}
if(!ok)process.exit(1);console.log('Alumas v13 flow check OK');
