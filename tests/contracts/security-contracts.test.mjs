import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('auth routes keep HTTP-only session protection',()=>{const files=['lib/auth.ts','app/api/auth/login/route.ts'].filter(fs.existsSync).map(read).join('\n');assert.match(files,/httpOnly|HTTP_ONLY/i)});
test('mutating API protection exists',()=>{const files=['middleware.ts','proxy.ts','lib/security.ts'].filter(fs.existsSync).map(read).join('\n');assert.match(files,/origin|ALLOWED_ORIGINS/i)});
test('readiness route checks runtime health',()=>{const p='app/api/readiness/route.ts';assert.ok(fs.existsSync(p));assert.match(read(p),/prisma|queryRaw|database/i)});
