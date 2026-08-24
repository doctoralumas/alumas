# Prisma migration policy (v28)

Older Alumas MVP revisions used `prisma db push` during rapid prototyping. From v28 onward, production/staging schema changes should use checked-in migrations.

## New environment
1. `npm install`
2. `npm run db:generate`
3. `npm run db:baseline baseline`
4. Review `prisma/migrations/<timestamp>_baseline/migration.sql`.
5. For a fresh database, use `npm run db:migrate:deploy`.

## Existing database already matching the schema
Do **not** blindly run a baseline CREATE script against it. Generate/review the baseline, then mark it applied using Prisma's `migrate resolve --applied <migration_name>` after confirming the live schema matches.

Subsequent schema changes should be generated with `npm run db:migrate:dev -- --name <change>` in development and applied with `npm run db:migrate:deploy` in staging/production.
