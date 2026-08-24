import {spawnSync} from "node:child_process";
if(!process.env.DATABASE_URL){console.error("DATABASE_URL gerekli");process.exit(2)}
const r=spawnSync(process.platform==="win32"?"npx.cmd":"npx",["prisma","migrate","status"],{stdio:"inherit",env:process.env});
if(r.status!==0){console.error("Migration gate FAILED: bekleyen, sapmış veya erişilemeyen migration durumu.");process.exit(r.status||1)}
console.log("Migration gate OK");
