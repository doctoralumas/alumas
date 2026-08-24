import fs from "node:fs";
const envName=process.argv.find(x=>x.startsWith("--env="))?.split("=")[1]||"staging";
if(!["staging","production"].includes(envName)){console.error("--env=staging|production");process.exit(2)}
const file=`.env.${envName}`;if(!fs.existsSync(file)){console.error(`${file} bulunamadı`);process.exit(2)}
const parsed=Object.fromEntries(fs.readFileSync(file,"utf8").split(/\r?\n/).filter(x=>x&&!x.trim().startsWith("#")&&x.includes("=")).map(x=>{const i=x.indexOf("=");return [x.slice(0,i).trim(),x.slice(i+1).trim().replace(/^\"|\"$/g,"")]}));
const matrix=JSON.parse(fs.readFileSync("deploy/secret-matrix.json","utf8"));
const req=[...matrix.required_all,...(matrix[`required_${envName}`]||[])];
const bad=req.filter(k=>!parsed[k]||/CHANGE_ME|change-me|^$/.test(parsed[k]));
if(parsed.SMS_PROVIDER==="twilio")bad.push(...["TWILIO_ACCOUNT_SID","TWILIO_AUTH_TOKEN","TWILIO_FROM"].filter(k=>!parsed[k]));
if(parsed.STORAGE_DRIVER==="s3")bad.push(...["S3_ENDPOINT","S3_BUCKET","S3_ACCESS_KEY_ID","S3_SECRET_ACCESS_KEY"].filter(k=>!parsed[k]));
if(parsed.VIDEO_PROVIDER==="daily")bad.push(...["DAILY_API_KEY"].filter(k=>!parsed[k]));
if(bad.length){console.error("Eksik/placeholder secrets:", [...new Set(bad)].join(", "));process.exit(1)}
console.log(JSON.stringify({ok:true,environment:envName,checked:req.length},null,2));
