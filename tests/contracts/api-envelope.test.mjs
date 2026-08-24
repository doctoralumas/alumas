import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("api error helper backward-compatible envelope kullanır",()=>{const s=fs.readFileSync("lib/api-response.ts","utf8");assert.match(s,/ok:false/);assert.match(s,/error:message/);assert.match(s,/code/)});
test("kritik route'lar validation helper kullanır",()=>{for(const f of ["app/api/auth/register/route.ts","app/api/auth/login/route.ts","app/api/appointments/route.ts","app/api/health/blood-pressure/route.ts"]){const s=fs.readFileSync(f,"utf8");assert.match(s,/VALIDATION_ERROR|zodDetails/)}});
