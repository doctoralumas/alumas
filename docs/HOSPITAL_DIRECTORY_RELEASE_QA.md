# ALUMAS hospital directory — release & QA gate

Updated: 2026-11-16. Scope: hospital expansion only, no insurance migration and no data deletion.

## Current independently sourced OSM inventory

- Source: 1,366 records, with 1,366 unique OSM IDs. This is **not** the number of independent, operating hospitals in Türkiye.
- Display-only suppression: 61 generic labels, former sites, entrances and hospital subdivisions; plus 8 duplicate OSM markers.
- Candidate OSM hospital cards **before comparison with existing ALUMAS hospitals**: 1,297.
- Existing ALUMAS directory hospital records last confirmed from Supabase by project owner: 527 total, 525 active. Registered hospital organization accounts are a separate category and may overlap.
- **Do not add 525 + 1,297 to claim that many independent hospitals.** Full cross-source matching requires querying all active production hospital records; sample matches are not a substitute.
- Dataset is never mutated or deleted by display QA. No OSM record becomes verified, insured, claimable, or appointable merely by appearing on the map.
- Missing source fields are not invented. A coordinate-only listing is permitted as an *unverified* map record, not as a certified medical provider.

## Checks

Run from repository root, with Node 22 and dependencies installed:

```powershell
npm install
npm run test:contracts
npm run hospital:audit
```

The audit checks each OSM source ID, source URL, ODbL attribution, source date, Türkiye coordinates, exclusion reasons and duplicate representative. It prints a machine-readable JSON report. **No writes occur.**

Compare all **actual** ALUMAS active hospitals and current external table in a read-only database audit:

```powershell
npm run hospital:audit -- --with-db
```

This opt-in mode loads existing local `.env` / `.env.local` credentials, queries `ExternalHospital`, active `DirectoryInstitution` hospitals and published `Organization` hospitals, and prints the cross-source matching candidates. It performs **no DELETE, INSERT, UPDATE or migrations**. Do not paste environment secrets or full DB connection strings into tickets.

## Release hard gates

1. The regular CI source/build checks and the complete Playwright suite must pass or each unrelated pre-existing failure must be documented and approved as an exception by the release owner. The historic eight E2E failures include stale seeded doctor names, missing claim selection, 401 health test request, and a legacy organization API assumption. A green build does **not** imply a green E2E suite.
2. `npm run hospital:audit -- --with-db` must show `issueCount=0`, `missingInDbCount=0`, `unexpectedInDbCount=0`, `changedInDbCount=0`. A mere `COUNT(*) = 1366` does not guarantee snapshot parity.
3. Review cross-source matching pairs for false positives and false negatives. Preserve existing ALUMAS hospital cards when a confident same-physical-hospital match exists; preserve both institutions when uncertain.
4. Confirm all displayed OSM cards are `UNREGISTERED`, `isVerified=false`, `canClaim=false` and do not create an appointment or false insurance match.
5. Confirm public data credits on both listing and map; independently downloadable unaltered OSM snapshot at `/api/osm-hospitals/dataset`, displaying `© OpenStreetMap contributors` and ODbL. Confirm the combined directory respects OSMF collective-database licensing guidance; obtain legal review for uncertainty about data combining.
6. Confirm published cards, filters, city-search behavior, mobile layout, and source links. Verify card counts from the actual `/api/organizations?type=HOSPITAL` response, **not arithmetic** on database rows.
7. Check production backup and rollback plan. No production data migration is required by this display change if `ExternalHospital` already contains the validated 1,366-row snapshot.

## Controlled production enablement

A production deployment of the feature branch is insufficient to turn on OSM listings. Once approval/gates are complete, deploy merged code and set BOTH Vercel Production environment variables:

```text
ALUMAS_OSM_DIRECTORY_ENABLED=1
ALUMAS_OSM_ODBL_DISTRIBUTION_READY=1
```

Re-deploy after environment changes if needed. Do not set `ALUMAS_OSM_LOCAL_PREVIEW=1` in Production.

**Rollback (no data deletion):** set `ALUMAS_OSM_DIRECTORY_ENABLED=0`, then re-deploy/restart the affected production runtime. Existing verified institutions stay in the directory, and independent OSM source records stay in their own table.

## Licence references

- https://www.openstreetmap.org/copyright
- https://osmfoundation.org/wiki/Attribution_Guidelines
- https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline
