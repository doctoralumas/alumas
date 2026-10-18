#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const getArgValue = (flag) => {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
};

const rawInputPath = getArgValue("--file") || "data/imports/sample-directory-institutions.csv";
const jsonReportArg = getArgValue("--json-report");
const applyMode = args.includes("--apply");
const confirmRemoteApply = args.includes("--confirm-remote-apply");
const allowSynthetic = args.includes("--allow-synthetic-fixtures");

let resolvedInputPath = path.resolve(process.cwd(), rawInputPath);
if (!fs.existsSync(resolvedInputPath)) {
  console.error(`[ERROR] File not found: ${resolvedInputPath}`);
  process.exit(1);
}

let resolvedCsvPath = resolvedInputPath;
let tempConvertedCsv = null;

if (resolvedInputPath.toLowerCase().endsWith(".xlsx") || resolvedInputPath.toLowerCase().endsWith(".xls")) {
  tempConvertedCsv = resolvedInputPath.replace(/\.xlsx?$/i, ".converted.csv");
  console.log(`[XLSX -> CSV] Excel file detected. Converting ${path.basename(resolvedInputPath)} to CSV...`);
  try {
    execFileSync("python", [
      path.resolve(process.cwd(), "scripts/convert-xlsx-to-csv.py"),
      resolvedInputPath,
      tempConvertedCsv,
    ], { stdio: "inherit" });
    resolvedCsvPath = tempConvertedCsv;
  } catch (err) {
    console.error(`[ERROR] Failed to convert Excel file to CSV: ${err.message}`);
    process.exit(1);
  }
}

// Execute via tsx so TypeScript modules (@/lib/directory-importer, @/lib/institution-directory) resolve cleanly
const runnerScript = `
import fs from "node:fs";
import { prisma } from "./lib/prisma.ts";
import { CURATED_DIRECTORY_INSTITUTIONS } from "./lib/directory-fixtures.ts";
import {
  parseDirectoryCsv,
  planDirectoryCsvImport,
} from "./lib/directory-importer.ts";

const csvPath = ${JSON.stringify(resolvedCsvPath)};
const originalFilePath = ${JSON.stringify(resolvedInputPath)};
const applyMode = ${JSON.stringify(applyMode)};
const confirmRemoteApply = ${JSON.stringify(confirmRemoteApply)};
const allowSynthetic = ${JSON.stringify(allowSynthetic)};
const jsonReportPath = ${JSON.stringify(jsonReportArg ? path.resolve(process.cwd(), jsonReportArg) : null)};

async function main() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isRemoteSupabase =
    dbUrl.includes("pooler.supabase.com") || dbUrl.includes("supabase.co");

  if (applyMode && isRemoteSupabase && !confirmRemoteApply) {
    console.error(
      "[SAFETY BLOCK] Refusing to execute --apply against remote/shared Supabase database without --confirm-remote-apply."
    );
    process.exit(2);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const rawRows = parseDirectoryCsv(csvContent);

  let dbDirectoryRows = [];
  let dbOrganizations = [];

  try {
    dbDirectoryRows = await prisma.directoryInstitution.findMany({
      include: { claims: true },
    });
    dbOrganizations = await prisma.organization.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        city: true,
        district: true,
        address: true,
        status: true,
      },
    });
  } catch {
    // Offline / unit-test fallback
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  // Authoritative baseline: use live DB records when present.
  // Only fall back to in-memory fixtures in test environments when DB is empty and --allow-synthetic-fixtures is explicitly passed.
  const existingDirectory = dbDirectoryRows.length > 0
    ? dbDirectoryRows
    : (allowSynthetic ? CURATED_DIRECTORY_INSTITUTIONS.map(item => ({ ...item, claims: [] })) : []);

  const plan = planDirectoryCsvImport(rawRows, existingDirectory, dbOrganizations, {
    allowSyntheticFixtures: allowSynthetic,
  });

  console.log("==================================================================");
  console.log(" ALUMAS — DIRECTORY INSTITUTION CSV IMPORTER");
  console.log("==================================================================");
  console.log("Mode                 :", applyMode ? "APPLY (Database Write)" : "DRY-RUN (Preview Only)");
  console.log("Source File          :", originalFilePath);
  if (originalFilePath !== csvPath) {
    console.log("Converted CSV        :", csvPath);
  }
  console.log("Total Records        :", plan.totalRows);
  console.log("Existing DB Baseline :", existingDirectory.length);
  console.log("Existing DB Orgs     :", dbOrganizations.length);
  console.log("------------------------------------------------------------------");
  console.log("SUMMARY:");
  console.log("  [+] CREATES                :", plan.summary.creates);
  console.log("  [~] UPDATES                :", plan.summary.updates);
  console.log("  [=] UNCHANGED (Idempotent) :", plan.summary.unchanged);
  console.log("  [S] SKIPPED (Owned/Linked) :", plan.summary.skippedOwned);
  console.log("  [D] DUPLICATES IN CSV      :", plan.summary.duplicatesInCsv);
  console.log("  [?] AMBIGUOUS (Review Req) :", plan.summary.ambiguousManualReview);
  console.log("  [!] INVALID (Rejected)     :", plan.summary.invalid);
  console.log("------------------------------------------------------------------");

  for (const d of plan.decisions) {
    const tag = {
      CREATE: "[CREATE]   ",
      UPDATE: "[UPDATE]   ",
      UNCHANGED: "[UNCHANGED]",
      SKIP_OWNED: "[SKIP_OWN] ",
      DUPLICATE_IN_CSV: "[DUP_CSV]  ",
      AMBIGUOUS_MANUAL_REVIEW: "[REVIEW]   ",
      INVALID: "[INVALID]  ",
    }[d.decision];
    const slugInfo = d.candidate ? \` -> slug="\${d.candidate.slug}" id="\${d.candidate.id}"\` : "";
    console.log(
      \`Row #\${String(d.rowNumber).padStart(2, "0")} \${tag} \${d.rawName || "(boş)"} (\${d.rawCity || "-"} / \${d.rawDistrict || "-"}) [\${d.rawType || "-"}]\${slugInfo}\`
    );
    console.log(\`        Reason: \${d.reason}\`);
    if (d.candidate?.warnings?.length) {
      for (const w of d.candidate.warnings) {
        console.log(\`        Warning: \${w}\`);
      }
    }
  }

  if (jsonReportPath) {
    fs.writeFileSync(jsonReportPath, JSON.stringify(plan, null, 2), "utf8");
    console.log("------------------------------------------------------------------");
    console.log("Saved JSON report to:", jsonReportPath);
  }

  if (!applyMode) {
    console.log("------------------------------------------------------------------");
    console.log("DRY-RUN COMPLETED. Zero database records were modified.");
    console.log("Pass --apply to execute safe CREATES and UPDATES.");
    return;
  }

  // Execute safe CREATES and UPDATES only (never touches SKIP_OWNED, AMBIGUOUS_MANUAL_REVIEW, or INVALID)
  let appliedCreates = 0;
  let appliedUpdates = 0;

  for (const d of plan.decisions) {
    if (d.decision === "CREATE" && d.candidate) {
      const c = d.candidate;
      await prisma.directoryInstitution.upsert({
        where: { id: c.id },
        update: {
          name: c.name,
          type: c.type,
          city: c.city,
          district: c.district,
          address: c.address,
          phone: c.phone,
          officialWebsite: c.officialWebsite,
          description: c.description,
          latitude: c.latitude,
          longitude: c.longitude,
          source: c.source,
          externalRef: c.externalRef,
          lastVerifiedAt: c.lastVerifiedAt ? new Date(c.lastVerifiedAt) : null,
        },
        create: {
          id: c.id,
          slug: c.slug,
          name: c.name,
          type: c.type,
          city: c.city,
          district: c.district,
          address: c.address,
          phone: c.phone,
          officialWebsite: c.officialWebsite,
          description: c.description,
          latitude: c.latitude,
          longitude: c.longitude,
          isOnDuty: false,
          onDutyUntil: null,
          source: c.source,
          externalRef: c.externalRef,
          lastVerifiedAt: c.lastVerifiedAt ? new Date(c.lastVerifiedAt) : null,
          isActive: true,
          organizationId: null,
        },
      });
      appliedCreates++;
    } else if (d.decision === "UPDATE" && d.candidate && d.matchedExistingId) {
      const c = d.candidate;
      await prisma.directoryInstitution.update({
        where: { id: d.matchedExistingId },
        data: {
          name: c.name,
          type: c.type,
          city: c.city,
          district: c.district,
          address: c.address,
          phone: c.phone,
          officialWebsite: c.officialWebsite,
          description: c.description,
          latitude: c.latitude,
          longitude: c.longitude,
          source: c.source,
          externalRef: c.externalRef,
          lastVerifiedAt: c.lastVerifiedAt ? new Date(c.lastVerifiedAt) : null,
        },
      });
      appliedUpdates++;
    }
  }

  await prisma.$disconnect().catch(() => {});
  console.log("------------------------------------------------------------------");
  console.log(\`APPLY COMPLETED: \${appliedCreates} created, \${appliedUpdates} updated.\`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;

try {
  execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", runnerScript],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    }
  );
} finally {
  if (tempConvertedCsv && fs.existsSync(tempConvertedCsv)) {
    try {
      fs.unlinkSync(tempConvertedCsv);
    } catch {}
  }
}

