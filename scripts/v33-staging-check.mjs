import fs from "node:fs";
const must=["deploy/caddy/Caddyfile.staging","deploy/staging.proxy.compose.yml","deploy/monitoring/uptime-monitors.json","deploy/cron/cron-jobs.json","deploy/staging-smoke.json",".github/workflows/cron-appointments.yml",".github/workflows/staging-launch-check.yml","scripts/dns-check.mjs","scripts/staging-smoke-v33.mjs","scripts/staging-launch.mjs","scripts/run-cron-job.mjs","DNS_AND_TLS.md","STAGING_LAUNCH_RUNBOOK.md","UPTIME_MONITORING.md","V33_STAGING_LAUNCH.md"];
let ok=true;for(const f of must){if(!fs.existsSync(f)){console.error("missing",f);ok=false}}
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));for(const s of ["staging:launch","staging:smoke","staging:dns-check","cron:run","v33:check"]){if(!pkg.scripts?.[s]){console.error("script missing",s);ok=false}}
const cron=JSON.parse(fs.readFileSync("deploy/cron/cron-jobs.json","utf8"));if(!cron.jobs?.some(x=>x.path==="/api/cron/appointments")){console.error("appointment cron missing");ok=false}
const smoke=JSON.parse(fs.readFileSync("deploy/staging-smoke.json","utf8"));if(!smoke.checks?.some(x=>x.path==="/api/readiness")||!smoke.checks?.some(x=>x.path==="/api/version")){console.error("critical smoke checks missing");ok=false}
const caddy=fs.readFileSync("deploy/caddy/Caddyfile.staging","utf8");if(!caddy.includes("reverse_proxy app:3000")){console.error("caddy upstream mismatch");ok=false}
if(!ok)process.exit(1);console.log("v33 staging launch check OK");
