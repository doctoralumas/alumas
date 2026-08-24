import {spawnSync} from "node:child_process";
function run(cmd,args,opts={}){console.log(`\n$ ${cmd} ${args.join(" ")}`);const r=spawnSync(cmd,args,{stdio:"inherit",shell:false,...opts});if(r.status!==0)process.exit(r.status??1)}
const env=process.env;if((env.RELEASE_CHANNEL||"")!=="staging"){console.error("NO-GO: RELEASE_CHANNEL=staging olmalı");process.exit(2)}
if(!env.STAGING_DOMAIN||/(^|\.)app\.alumas\./i.test(env.STAGING_DOMAIN)||/production|prod/i.test(env.STAGING_DOMAIN)){console.error("NO-GO: güvenli bir STAGING_DOMAIN gerekli");process.exit(2)}
if(!env.ALUMAS_IMAGE?.includes("@sha256:")){console.error("NO-GO: ALUMAS_IMAGE immutable @sha256 digest olmalı");process.exit(2)}
if(env.STAGING_SKIP_DNS!=="1")run("node",["scripts/dns-check.mjs"]);
run("node",["scripts/secret-matrix-check.mjs","--env=staging"]);
run("node",["scripts/go-no-go.mjs"]);
if(env.STAGING_DRY_RUN==="1"){console.log("DRY-RUN GO: docker deploy atlandı");process.exit(0)}
run("docker",["compose","--env-file",".env.staging","-f","deploy/staging.compose.yml","pull"]);
run("docker",["compose","--env-file",".env.staging","-f","deploy/staging.compose.yml","up","-d","--remove-orphans"]);
run("docker",["compose","--env-file",".env.staging","-f","deploy/staging.compose.yml","exec","-T","app","npx","prisma","migrate","deploy"]);
if(env.STAGING_ENABLE_PROXY==="1")run("docker",["compose","--env-file",".env.staging","-f","deploy/staging.compose.yml","-f","deploy/staging.proxy.compose.yml","up","-d","proxy"]);
const base=env.STAGING_BASE_URL||`https://${env.STAGING_DOMAIN}`;run("node",["scripts/staging-smoke-v33.mjs"],{env:{...env,STAGING_BASE_URL:base}});
console.log("\nSTAGING LAUNCH: GO ✓");
