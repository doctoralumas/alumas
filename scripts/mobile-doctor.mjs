import fs from 'node:fs'; import {execSync} from 'node:child_process';
const rows=[]; const test=(name,fn)=>{try{const v=fn();rows.push(['OK',name,v||''])}catch(e){rows.push(['FAIL',name,(e.stderr?.toString()||e.message).trim().split('\n')[0]])}};
test('Node',()=>process.version);
test('Capacitor config',()=>fs.existsSync('capacitor.config.ts')?'var':'yok');
test('iOS project',()=>fs.existsSync('ios')?'var':'henüz üretilmedi');
test('Android project',()=>fs.existsSync('android')?'var':'henüz üretilmedi');
test('npm',()=>execSync('npm --version').toString().trim());
console.table(rows.map(([status,check,detail])=>({status,check,detail})));
if(rows.some(r=>r[0]==='FAIL')) process.exit(1);
