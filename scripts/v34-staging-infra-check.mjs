import fs from 'node:fs';
const must=['scripts/host-preflight.sh','scripts/bootstrap-staging-host.sh','scripts/remote-staging-deploy.sh','scripts/remote-staging-rollback.sh','scripts/collect-staging-logs.sh','.github/workflows/staging-deploy.yml','FIRST_LIVE_DEPLOY.md','STAGING_HOST_SECURITY.md','V34_STAGING_INFRASTRUCTURE.md'];
let ok=true;for(const f of must){if(!fs.existsSync(f)){console.error('missing',f);ok=false}}
const d=fs.readFileSync('scripts/remote-staging-deploy.sh','utf8');for(const term of ['@sha256:','pg_dump','prisma migrate deploy','staging-smoke-v33.mjs'])if(!d.includes(term)){console.error('deploy guard missing',term);ok=false}
const r=fs.readFileSync('scripts/remote-staging-rollback.sh','utf8');if(!r.includes('ROLLBACK_STAGING')||!r.includes('Schema rollback')){console.error('rollback guard missing');ok=false}
if(!ok)process.exit(1);console.log('v34 staging infrastructure check OK');
