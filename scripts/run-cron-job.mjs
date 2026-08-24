import fs from "node:fs";
const name=process.argv[2];if(!name){console.error("Kullanım: npm run cron:run -- appointments-completion");process.exit(2)}
const cfg=JSON.parse(fs.readFileSync("deploy/cron/cron-jobs.json","utf8"));const job=cfg.jobs.find(x=>x.name===name);if(!job){console.error("Cron job bulunamadı");process.exit(2)}
const base=(process.env.APP_URL||"").replace(/\/$/,"");const secret=process.env[job.secretEnv];if(!base||!secret){console.error(`APP_URL ve ${job.secretEnv} gerekli`);process.exit(2)}
const r=await fetch(base+job.path,{method:job.method||"POST",headers:{authorization:`Bearer ${secret}`,"x-cron-secret":secret,"user-agent":"alumas-cron-runner"},signal:AbortSignal.timeout((job.timeoutSeconds||30)*1000)});const text=await r.text();console.log(`${job.name}: ${r.status} ${text.slice(0,1000)}`);if(!r.ok)process.exit(1);
