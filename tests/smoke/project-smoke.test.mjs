import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const must=['app/page.tsx','app/health/page.tsx','app/doctors/page.tsx','app/organizations/page.tsx','app/login/page.tsx','prisma/schema.prisma'];
for(const p of must)test(`core file exists: ${p}`,()=>assert.ok(fs.existsSync(p)));
test('package versions are pinned for core runtime',()=>{const p=JSON.parse(fs.readFileSync('package.json','utf8'));for(const k of ['next','react','react-dom','@prisma/client'])assert.ok(p.dependencies[k]&&!p.dependencies[k].startsWith('*'))});
