# Alumas v28 — Build, Migration & Test Hardening

v28 changes the project from source-only checks toward reproducible build/database validation.

## Local validation order
```bash
npm install
npm run schema:check
npm run db:generate
npm run typecheck
npm test
npm run build
```

With a disposable PostgreSQL database configured in `DATABASE_URL`:
```bash
npm run db:push
npm run db:seed
npm run db:smoke
```

## Migration baseline
The historical MVP was developed with `db push`. `npm run db:baseline baseline` generates a baseline SQL migration from the current Prisma schema once Prisma dependencies are installed. The SQL must be reviewed before production use.

## CI
The web job runs schema check, Prisma generate, typecheck, contract/smoke tests and Next build. A separate database job starts PostgreSQL, pushes the schema, seeds it and executes `db:smoke`.

## Important
Source tests do not replace real browser/device E2E tests. Store-signing, HealthKit/Health Connect, push, SMS, video, maps and cloud storage still require their external credentials and physical-device/staging verification.
