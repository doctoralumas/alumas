import {spawnSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';
const name=process.argv[2]||'baseline';
const stamp=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
const dir=path.join('prisma','migrations',`${stamp}_${name}`);fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,'migration.sql');
const r=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['prisma','migrate','diff','--from-empty','--to-schema-datamodel','prisma/schema.prisma','--script'],{encoding:'utf8'});
if(r.status!==0){fs.rmSync(dir,{recursive:true,force:true});console.error(r.stderr||r.stdout||'Prisma migrate diff failed');process.exit(r.status||1)}
fs.writeFileSync(out,r.stdout);console.log(`Baseline migration written: ${out}`);
console.log('Review the SQL before marking it as applied on an existing database.');
