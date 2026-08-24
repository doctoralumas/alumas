import fs from "node:fs";
const target=process.argv.find(x=>x.startsWith("--target="))?.split("=")[1];
const confirm=process.argv.find(x=>x.startsWith("--confirm="))?.split("=")[1];
if(!["staging","production"].includes(target||"")){console.error("--target=staging|production gerekli");process.exit(2)}
if(confirm!==`PROMOTE_${target?.toUpperCase()}`){console.error(`Açık onay gerekli: --confirm=PROMOTE_${target?.toUpperCase()}`);process.exit(2)}
if(!fs.existsSync("dist/release-manifest.json")){console.error("Önce npm run release:manifest çalıştırın");process.exit(2)}
const m=JSON.parse(fs.readFileSync("dist/release-manifest.json","utf8"));
console.log(JSON.stringify({ok:true,target,version:m.version,buildSha:m.buildSha,message:"Promotion gate passed. Deployment provider step can now run."},null,2));
