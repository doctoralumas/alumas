# Alumas v6 — production release checklist

## 1. Database
- Use managed PostgreSQL with encrypted backups and point-in-time recovery.
- Run `npm run db:generate` then `npm run db:push` for MVP; use versioned Prisma migrations before regulated production.

## 2. SMS OTP
Set `SMS_PROVIDER=twilio` and Twilio credentials. The app sends OTP through Twilio REST and rate-limits requests. Replace/adapt `lib/sms.ts` for a Turkish provider if desired.

## 3. Push notifications
Set Firebase service account environment values. Alumas uses FCM HTTP v1 from the server. For iOS, configure the APNs authentication key in Firebase; the same FCM endpoint can then deliver to iOS tokens. Never ship the service-account private key in the mobile app.

## 4. Private health document storage
Set `STORAGE_DRIVER=s3` and S3-compatible credentials (AWS S3 / Cloudflare R2 etc.). Files are private and only downloaded through an authenticated Alumas API route. Configure bucket encryption, lifecycle rules, malware scanning and restricted IAM credentials.

## 5. KVKK / privacy
`PrivacyConsent` stores versioned, purpose-specific records. The UI deliberately separates privacy notice acknowledgement from optional explicit consents such as Health integration and marketing. Texts in this MVP are product placeholders, not legal advice. Before launch, a Turkish privacy lawyer / DPO should define the controller identity, processing purposes, legal bases, retention, transfer mechanisms, VERBIS obligations if applicable, data-subject request process and special-category-data controls.

## 6. User rights
- `/api/account/export` exports the account's structured data as JSON.
- `/api/account/delete` deletes the account after explicit confirmation and password verification when applicable.
- Production retention rules may require a deletion workflow that first separates legally retained records from deletable data.

## 7. Audit
Security/privacy-sensitive actions write to `AuditLog`; IP values are one-way hashed with `AUDIT_HASH_SALT`. Export logs to an append-only/SIEM system for production and define retention/access policies.

## 8. Deployment
Copy `.env.production.example` to `.env.production`, replace every secret, then run:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Check `/api/healthcheck`. Put the service behind HTTPS, a reverse proxy/WAF and rate limiting.

## 9. Before TestFlight / Play Internal Testing
- Configure Firebase + APNs and verify a push on a real iPhone and Android device.
- Configure HealthKit / Health Connect permissions and store declarations.
- Replace all placeholder privacy texts with approved legal versions.
- Test account export/deletion and revoke push tokens on logout/deletion.
- Run dependency, SAST, secret and container scans; commission a penetration test before real health data is stored.


## v27 Hardening
- `SECURITY_HASH_SALT` güçlü rastgele secret olmalı.
- `ALLOWED_ORIGINS` production/staging originlerini virgülle ayırmalı.
- Deploy sonrası `/api/readiness` 200 dönmeli.
- `npm run security:check` çalıştırılmalı.
- Production verisi öncesi Prisma baseline migration oluşturulmalı.
