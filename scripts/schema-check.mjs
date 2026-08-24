import fs from 'node:fs';
const src=fs.readFileSync('prisma/schema.prisma','utf8');
const models=[...src.matchAll(/^model\s+(\w+)\s*\{/gm)].map(x=>x[1]);
const enums=[...src.matchAll(/^enum\s+(\w+)\s*\{/gm)].map(x=>x[1]);
const dup=a=>a.filter((v,i)=>a.indexOf(v)!==i);
let ok=true;
for(const [label,list] of [['model',models],['enum',enums]]){const d=dup(list);if(d.length){console.error(`duplicate ${label}:`,d);ok=false}}
let depth=0; for(const c of src){if(c==='{')depth++; if(c==='}')depth--; if(depth<0){ok=false;break}}
if(depth!==0){console.error('schema brace imbalance:',depth);ok=false}
for(const must of ['User','Appointment','Organization','BloodPressureReading','GlucoseReading','SleepRecord','HealthReminder']){if(!models.includes(must)){console.error('missing core model',must);ok=false}}
if(!ok)process.exit(1);console.log(`schema check OK (${models.length} models, ${enums.length} enums)`);
