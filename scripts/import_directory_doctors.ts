import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import {
  parseExpertCsv,
  planExpertCsvImport,
} from "../lib/expert-importer";

const args = process.argv.slice(2);
const getArgValue = (flag: string): string | null => {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
};

const rawInputPath = getArgValue("--file") || "data/imports/alumas_experts_pilot_batch1_STAGED.csv";
const jsonReportArg = getArgValue("--json-report");
const applyMode = args.includes("--apply");
const confirmRemoteApply = args.includes("--confirm-remote-apply");
const limitArg = getArgValue("--limit");
const limit = limitArg ? parseInt(limitArg, 10) : null;

const resolvedInputPath = path.resolve(process.cwd(), rawInputPath);
if (!fs.existsSync(resolvedInputPath)) {
  console.error(`[ERROR] File not found: ${resolvedInputPath}`);
  process.exit(1);
}

async function main() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const isRemoteSupabase =
    dbUrl.includes("pooler.supabase.com") || dbUrl.includes("supabase.co") || dbUrl.includes("supabase.net");

  if (applyMode && isRemoteSupabase && !confirmRemoteApply) {
    console.error(
      "\n[SAFETY BLOCK] Refusing to execute --apply against remote Supabase database without --confirm-remote-apply.\n"
    );
    process.exit(2);
  }

  console.log("===============================================================================");
  console.log("ALUMAS EXPERTS DIRECTORY INGESTION PIPELINE");
  console.log("===============================================================================");
  console.log(`File: ${resolvedInputPath}`);
  console.log(`Execution Mode: ${applyMode ? "APPLY (WRITING TO DATABASE)" : "DRY-RUN (READ-ONLY)"}`);
  console.log(`Target Database: ${isRemoteSupabase ? "REMOTE SUPABASE" : "LOCAL/STAGING"}`);
  console.log("===============================================================================\n");

  const csvContent = fs.readFileSync(resolvedInputPath, "utf8");
  let rawRows = parseExpertCsv(csvContent);
  if (limit && limit > 0) {
    rawRows = rawRows.slice(0, limit);
  }

  console.log(`[PARSER] Loaded ${rawRows.length} rows from CSV.\n`);

  console.log("[DB] Fetching existing DirectoryDoctor and Doctor baseline...");
  const [existingDirectoryDoctors, existingRegisteredDoctors] = await Promise.all([
    prisma.directoryDoctor.findMany(),
    prisma.doctor.findMany({
      select: { id: true, name: true, specialty: true, city: true, isVerified: true },
    }),
  ]);

  console.log(
    `[DB] Existing DirectoryDoctors: ${existingDirectoryDoctors.length}, Registered Doctors: ${existingRegisteredDoctors.length}\n`
  );

  const plan = planExpertCsvImport(rawRows, existingDirectoryDoctors, existingRegisteredDoctors);

  console.log("===============================================================================");
  console.log("IMPORT PLAN SUMMARY");
  console.log("===============================================================================");
  console.log(`Total Candidate Rows:       ${plan.totalRows}`);
  console.log(`Ready to CREATE:            ${plan.summary.creates}`);
  console.log(`Ready to UPDATE:            ${plan.summary.updates}`);
  console.log(`UNCHANGED (Already in DB):  ${plan.summary.unchanged}`);
  console.log(`SKIPPED (Already Claimed):  ${plan.summary.skippedClaimed}`);
  console.log(`DUPLICATES in Input:        ${plan.summary.duplicatesInInput}`);
  console.log(`AMBIGUOUS (Manual Review):  ${plan.summary.ambiguousManualReview}`);
  console.log(`INVALID (Validation Err):   ${plan.summary.invalid}`);
  console.log("===============================================================================\n");

  if (plan.summary.invalid > 0) {
    console.log("--- SAMPLES OF INVALID ROWS ---");
    const invalidSamples = plan.decisions.filter((d) => d.decision === "INVALID").slice(0, 5);
    for (const s of invalidSamples) {
      console.log(`  Row ${s.rowNumber}: [${s.rawTitle}] ${s.rawName} (${s.rawSpecialty} - ${s.rawCity}) -> ${s.reason}`);
    }
    console.log("");
  }

  if (plan.summary.duplicatesInInput > 0) {
    console.log("--- SAMPLES OF DUPLICATE ROWS IN INPUT ---");
    const dupSamples = plan.decisions.filter((d) => d.decision === "DUPLICATE_IN_INPUT").slice(0, 5);
    for (const s of dupSamples) {
      console.log(`  Row ${s.rowNumber}: ${s.rawName} (${s.externalRef}) -> ${s.reason}`);
    }
    console.log("");
  }

  if (applyMode) {
    console.log("[APPLY] Committing approved changes to database...");
    let createdCount = 0;
    let updatedCount = 0;

    for (const d of plan.decisions) {
      if (d.decision === "CREATE" && d.candidate) {
        await prisma.directoryDoctor.create({
          data: {
            slug: d.candidate.slug,
            name: d.candidate.name,
            title: d.candidate.title,
            specialty: d.candidate.specialty,
            hospital: d.candidate.hospital,
            city: d.candidate.city,
            district: d.candidate.district,
            address: d.candidate.address,
            phone: d.candidate.phone,
            officialWebsite: d.candidate.officialWebsite,
            description: d.candidate.description,
            source: d.candidate.source,
            externalRef: d.candidate.externalRef,
            lastVerifiedAt: d.candidate.lastVerifiedAt ? new Date(d.candidate.lastVerifiedAt) : new Date(),
            isActive: true,
            doctorId: null, // Strictly null: never synthesize User or Doctor
          },
        });
        createdCount++;
      } else if (d.decision === "UPDATE" && d.candidate && d.matchedExistingId) {
        await prisma.directoryDoctor.update({
          where: { id: d.matchedExistingId },
          data: {
            name: d.candidate.name,
            title: d.candidate.title,
            specialty: d.candidate.specialty,
            hospital: d.candidate.hospital,
            city: d.candidate.city,
            district: d.candidate.district,
            address: d.candidate.address,
            phone: d.candidate.phone,
            officialWebsite: d.candidate.officialWebsite,
            description: d.candidate.description,
            source: d.candidate.source,
            lastVerifiedAt: d.candidate.lastVerifiedAt ? new Date(d.candidate.lastVerifiedAt) : new Date(),
          },
        });
        updatedCount++;
      }
    }

    console.log(`[APPLY COMPLETE] Created: ${createdCount}, Updated: ${updatedCount}\n`);
  } else {
    console.log("[DRY-RUN] No records were created or modified. Use --apply to execute.\n");
  }

  if (jsonReportArg) {
    const jsonReportPath = path.resolve(process.cwd(), jsonReportArg);
    fs.writeFileSync(jsonReportPath, JSON.stringify(plan, null, 2), "utf8");
    console.log(`[REPORT] Full plan written to ${jsonReportPath}`);
  }
}

main()
  .catch((err) => {
    console.error("FATAL ERROR in import runner:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect().catch(() => {}));
