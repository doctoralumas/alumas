import fs from 'node:fs';
const must=['scripts/schema-check.mjs','scripts/db-smoke.mjs','scripts/create-baseline-migration.mjs','tests/contracts/security-contracts.test.mjs','tests/smoke/project-smoke.test.mjs','V28_BUILD_AND_TEST.md','prisma/migrations/README.md'];
let ok=true;for(const f of must){if(!fs.existsSync(f)){console.error('missing',f);ok=false}}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));for(const s of ['schema:check','db:smoke','db:baseline','test','v28:check'])if(!pkg.scripts?.[s]){console.error('missing script',s);ok=false}
if(!ok)process.exit(1);console.log('v28 hardening check OK');
