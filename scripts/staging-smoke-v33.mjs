const base=(process.env.STAGING_BASE_URL||process.env.APP_URL||"").replace(/\/$/,"");
if(!/^https:\/\//.test(base)){console.error("STAGING_BASE_URL https:// ile başlamalı");process.exit(2)}
const expectedChannel=process.env.EXPECTED_RELEASE_CHANNEL||"staging";
const endpoints=[
  ["healthcheck","/api/healthcheck",200],
  ["readiness","/api/readiness",200],
  ["version","/api/version",200],
  ["app-config","/api/app-config",200],
  ["organizations","/api/organizations",200]
];
let fail=0;const results=[];
for(const [name,path,status] of endpoints){const started=Date.now();try{const r=await fetch(base+path,{headers:{"user-agent":"alumas-v33-smoke"},redirect:"manual",signal:AbortSignal.timeout(15000)});let body=null;try{body=await r.json()}catch{};const ok=r.status===status;results.push({name,path,status:r.status,ms:Date.now()-started,ok});if(!ok)fail++;if(name==="version"&&body){if(body.channel&&body.channel!==expectedChannel){results.at(-1).ok=false;results.at(-1).reason=`channel ${body.channel} != ${expectedChannel}`;fail++}if(!body.version||!body.buildSha){results.at(-1).ok=false;results.at(-1).reason="version/buildSha missing";fail++}}}catch(e){results.push({name,path,ok:false,error:e?.message||String(e)});fail++}}
console.log(JSON.stringify({base,ok:fail===0,results},null,2));if(fail)process.exit(1);
