import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const expected=[
  '/', '/services','/health','/doctors','/nearby','/home-care','/emergency','/health-tourism','/organizations','/health/cycle','/health/medications','/health/labs','/insurance','/calendar','/health-card','/profile','/campaigns','/phone-directory','/health/blood-pressure','/health/glucose','/health/sleep','/health/water','/health/body','/health/imaging','/health/vaccinations','/health/allergies','/health/medical-history','/health/reports','/health/family-hub','/health/family-access','/health/family-profiles','/appointments','/messages','/notifications','/health-circle','/onboarding/doctor','/business/apply','/agency/apply'
];
function pageFor(route){if(route==='/')return 'app/page.tsx'; return path.join('app',route.slice(1),'page.tsx')}
let bad=false;
for(const route of expected){const f=pageFor(route);if(!fs.existsSync(path.join(root,f))){console.error('MISSING ROUTE',route,'->',f);bad=true}}
const home=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
for(const route of ['/health','/doctors','/nearby','/home-care','/emergency','/health-tourism','/organizations','/health/cycle','/health/medications','/health/labs','/insurance','/calendar','/health-card','/profile']){if(!home.includes(`href:"${route}"`)&&!home.includes(`href="${route}"`)){console.error('HOME LINK MISSING',route);bad=true}}
const assets=['health.webp','doctor.webp','nearby.webp','home-care.webp','emergency.webp','health-tourism.webp','organizations.webp','cycle.webp','medications.webp','labs.webp','insurance.webp','calendar.webp','health-card.webp','profile.webp','hero-doctor.webp'];
for(const a of assets){if(!fs.existsSync(path.join(root,'public/home-visuals',a))){console.error('HOME ASSET MISSING',a);bad=true}}
const auth=fs.readFileSync(path.join(root,'components/auth-form.tsx'),'utf8');
for(const t of ['PATIENT','DOCTOR','ORGANIZATION','AGENCY'])if(!auth.includes(t)){console.error('ACCOUNT TYPE MISSING',t);bad=true}
if(bad)process.exit(1);
console.log(`v41 route check OK — ${expected.length} routes, ${assets.length} home visuals, 4 account types`);
