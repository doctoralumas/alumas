const mode = process.argv.includes('--staging') ? 'staging' : 'production';
const errors = [];
const warnings = [];
const get = (k) => (process.env[k] || '').trim();
const placeholder = (v) => !v || /CHANGE_ME|CHANGE_TO|<account>|\.\.\./i.test(v);
const required = ['DATABASE_URL','AUDIT_HASH_SALT','CAPACITOR_SERVER_URL'];
for (const key of required) if (placeholder(get(key))) errors.push(`${key} eksik veya placeholder.`);
if (get('AUDIT_HASH_SALT').length < 32) errors.push('AUDIT_HASH_SALT en az 32 karakter olmalı.');
try { const u = new URL(get('CAPACITOR_SERVER_URL')); if (u.protocol !== 'https:' && mode === 'production') errors.push('Production CAPACITOR_SERVER_URL HTTPS olmalı.'); } catch { errors.push('CAPACITOR_SERVER_URL geçerli bir URL değil.'); }
if (get('SMS_PROVIDER') === 'twilio') {
  for (const k of ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_FROM']) if (placeholder(get(k))) errors.push(`${k}, SMS_PROVIDER=twilio için gerekli.`);
} else warnings.push('SMS_PROVIDER twilio değil; gerçek SMS gönderimi kapalı olabilir.');
for (const k of ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY']) if (placeholder(get(k))) errors.push(`${k} gerçek push için gerekli.`);
if (get('FIREBASE_PRIVATE_KEY') && !get('FIREBASE_PRIVATE_KEY').includes('PRIVATE KEY')) errors.push('FIREBASE_PRIVATE_KEY biçimi geçersiz görünüyor.');
if (get('STORAGE_DRIVER') === 's3') {
  for (const k of ['S3_ENDPOINT','S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY']) if (placeholder(get(k))) errors.push(`${k}, STORAGE_DRIVER=s3 için gerekli.`);
} else warnings.push('STORAGE_DRIVER s3 değil; production sağlık belgeleri yerel diskte kalabilir.');
console.log(`Alumas ${mode} environment kontrolü`);
for (const w of warnings) console.log(`WARN: ${w}`);
if (errors.length) { for (const e of errors) console.error(`ERROR: ${e}`); process.exit(1); }
console.log('OK: Zorunlu environment kontrolleri geçti.');
