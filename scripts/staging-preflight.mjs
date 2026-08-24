const base = (process.env.ALUMAS_BASE_URL || process.env.CAPACITOR_SERVER_URL || '').replace(/\/$/, '');
if (!base) { console.error('ALUMAS_BASE_URL veya CAPACITOR_SERVER_URL gerekli.'); process.exit(1); }
const checks = [
  ['/api/healthcheck', 200],
  ['/', 200],
  ['/login', 200],
  ['/privacy', 200],
];
let failed = 0;
for (const [path, expected] of checks) {
  try {
    const r = await fetch(base + path, {redirect:'manual'});
    const ok = r.status === expected || (path === '/' && [301,302,307,308].includes(r.status));
    console.log(`${ok ? 'OK' : 'FAIL'} ${path} -> ${r.status}`);
    if (!ok) failed++;
  } catch (e) { console.log(`FAIL ${path} -> ${e.message}`); failed++; }
}
if (failed) process.exit(1);
console.log('Staging HTTP preflight geçti.');
