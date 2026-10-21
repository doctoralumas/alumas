import fs from "fs";
import path from "path";
import { verifyExpertProfile, formatTurkishProperCase } from "../lib/expert-validator";
import { normalizeProfessionalTitle } from "../lib/expert-importer";
import { cleanProfessionalName } from "../lib/expert-directory";

interface EvidenceLedgerRow {
  source_id: string;
  professional_name: string;
  profession: string;
  specialty: string;
  city: string;
  institution: string;
  actual_profile_url: string;
  final_resolved_url: string;
  source_page_url: string;
  verification_timestamp: string;
  observed_http_status: string;
  identity_match_result: string;
  profession_match_result: string;
  institution_match_result: string;
  eligibility_status:
    | "VERIFIED_FOR_DIRECTORY"
    | "QUARANTINED"
    | "INACCESSIBLE"
    | "INSUFFICIENT_EVIDENCE"
    | "DUPLICATE"
    | "AMBIGUOUS"
    | "OUT_OF_SCOPE"
    | "GENERIC_PAGE_REDIRECT"
    | "MISMATCHED_GEOGRAPHY";
  exclusion_reason: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

async function reconcileAndStage() {
  console.log("===============================================================================");
  console.log("ALUMAS EXPERTS DIRECTORY — RIGOROUS RE-AUDIT & RECONCILIATION (QUALITY V2)");
  console.log("Auditing all 150 candidates with professional-specific location verification");
  console.log("===============================================================================\n");

  const csvPath = path.resolve("data/imports/alumas_experts_phase2_VERIFIED_STAGED.csv");
  const rawCsv = fs.readFileSync(csvPath, "utf-8");
  const lines = rawCsv.trim().split("\n");

  const candidatesToAudit: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const f = parseCsvLine(lines[i]);
    candidatesToAudit.push({
      rowIdx: i,
      rawName: f[0],
      rawTitle: f[1],
      rawSpecialty: f[2],
      rawHospital: f[3],
      rawCity: f[4],
      rawDistrict: f[5] || null,
      rawAddress: f[6] || null,
      rawPhone: f[7] || null,
      sourceUrl: f[8],
      description: f[9] || null,
      sourceId: f[10],
      externalRef: f[11],
    });
  }

  console.log(`Loaded ${candidatesToAudit.length} candidate rows to re-audit.`);

  const ledger: EvidenceLedgerRow[] = [];
  const approvedStagedRows: any[] = [];
  const quarantinedRows: any[] = [];
  const concurrency = 6;
  const queue = [...candidatesToAudit];
  let processed = 0;

  async function worker() {
    while (queue.length > 0) {
      const c = queue.shift();
      if (!c) break;

      const timestamp = new Date().toISOString();
      const verified = await verifyExpertProfile(
        {
          name: c.rawName,
          title: c.rawTitle,
          specialty: c.rawSpecialty,
          hospital: c.rawHospital,
          city: c.rawCity,
          district: c.rawDistrict,
          sourceId: c.sourceId,
          sourceUrl: c.sourceUrl,
        },
        8000
      );

      // Determine profession
      let profession = "Physician";
      if (c.sourceId === "SRC-HOSPITADENT-01" || /diş|dent/i.test(verified.extractedSpecialty)) {
        profession = "Dentist";
      }

      if (!verified.isEligible) {
        const isQuarantine = verified.rejectionCode === "INSUFFICIENT_LOCATION_EVIDENCE";
        const status = isQuarantine
          ? "QUARANTINED"
          : verified.rejectionCode === "GENERIC_PAGE_REDIRECT"
          ? "GENERIC_PAGE_REDIRECT"
          : verified.rejectionCode === "MISMATCHED_GEOGRAPHY"
          ? "MISMATCHED_GEOGRAPHY"
          : verified.httpStatus === 403
          ? "INACCESSIBLE"
          : "INSUFFICIENT_EVIDENCE";

        ledger.push({
          source_id: c.sourceId,
          professional_name: c.rawName,
          profession,
          specialty: c.rawSpecialty,
          city: verified.extractedCity || c.rawCity || "UNSPECIFIED",
          institution: verified.extractedHospital || c.rawHospital || "Hospitadent Diş Hastanesi",
          actual_profile_url: c.sourceUrl,
          final_resolved_url: verified.finalResolvedUrl,
          source_page_url: c.sourceUrl,
          verification_timestamp: timestamp,
          observed_http_status: String(verified.httpStatus || "FAILED"),
          identity_match_result: verified.nameMatchedInEntity ? "MATCHED" : "FAILED",
          profession_match_result: "UNVERIFIED",
          institution_match_result: "UNVERIFIED",
          eligibility_status: status,
          exclusion_reason: verified.exclusionReason,
        });

        if (isQuarantine) {
          quarantinedRows.push({
            name: c.rawName,
            source: c.sourceId,
            url: c.sourceUrl,
            reason: verified.exclusionReason,
          });
        }
      } else {
        // Individual-attributable values
        const finalTitle = verified.extractedTitle || c.rawTitle;
        const finalSpecialty = verified.extractedSpecialty || c.rawSpecialty;
        const finalHospital = verified.extractedHospital || c.rawHospital;
        const finalCity = verified.extractedCity || c.rawCity;
        const finalDistrict = verified.extractedDistrict || c.rawDistrict;
        const finalAddress = verified.extractedAddress || c.rawAddress;
        const finalPhone = verified.extractedPhone || c.rawPhone;

        const cleanName = formatTurkishProperCase(cleanProfessionalName(verified.extractedName || c.rawName));

        ledger.push({
          source_id: c.sourceId,
          professional_name: cleanName,
          profession,
          specialty: finalSpecialty,
          city: finalCity,
          institution: finalHospital,
          actual_profile_url: c.sourceUrl,
          final_resolved_url: verified.finalResolvedUrl,
          source_page_url: c.sourceUrl,
          verification_timestamp: timestamp,
          observed_http_status: "200",
          identity_match_result: "MATCHED_IN_ENTITY",
          profession_match_result: "MATCHED",
          institution_match_result: "MATCHED",
          eligibility_status: "VERIFIED_FOR_DIRECTORY",
          exclusion_reason: "NONE",
        });

        approvedStagedRows.push({
          name: cleanName,
          title: finalTitle,
          specialty: finalSpecialty,
          hospital: finalHospital,
          city: finalCity,
          district: finalDistrict,
          address: finalAddress,
          phone: finalPhone,
          officialWebsite: c.sourceUrl,
          description: `${finalHospital} bünyesinde ${finalSpecialty} alanında görev yapan ${
            profession === "Dentist" ? "diş hekimi" : "hekim"
          }.`,
          source: c.sourceId,
          externalRef: c.externalRef,
          lastVerifiedAt: timestamp,
        });
      }

      processed++;
      if (processed % 25 === 0 || processed === candidatesToAudit.length) {
        console.log(`Re-audited ${processed}/${candidatesToAudit.length} records...`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log("\n================ RE-AUDIT SUMMARY ================");
  console.log(`Total candidates audited:   ${candidatesToAudit.length}`);
  console.log(`Genuinely Approved Records: ${approvedStagedRows.length}`);
  console.log(`Quarantined Records:        ${quarantinedRows.length}`);
  console.log(`Excluded Other Records:     ${candidatesToAudit.length - approvedStagedRows.length - quarantinedRows.length}`);

  if (quarantinedRows.length > 0) {
    console.log("\n--- QUARANTINED RECORDS DETAIL ---");
    for (const q of quarantinedRows) {
      console.log(`  - [${q.source}] ${q.name} | URL: ${q.url}`);
      console.log(`    Reason: ${q.reason}`);
    }
  }

  // Write Evidence Ledger CSV
  const ledgerHeader =
    "source_id,professional_name,profession,specialty,city,institution,actual_profile_url,final_resolved_url,source_page_url,verification_timestamp,observed_http_status,identity_match_result,profession_match_result,institution_match_result,eligibility_status,exclusion_reason\n";
  const ledgerLines = ledger.map(
    (r) =>
      `"${r.source_id}","${r.professional_name}","${r.profession}","${r.specialty}","${r.city}","${r.institution}","${r.actual_profile_url}","${r.final_resolved_url}","${r.source_page_url}","${r.verification_timestamp}","${r.observed_http_status}","${r.identity_match_result}","${r.profession_match_result}","${r.institution_match_result}","${r.eligibility_status}","${r.exclusion_reason}"`
  );
  fs.writeFileSync(
    "data/sources/alumas_experts_phase2_evidence_ledger.csv",
    ledgerHeader + ledgerLines.join("\n"),
    "utf-8"
  );
  console.log("\nUpdated evidence ledger: data/sources/alumas_experts_phase2_evidence_ledger.csv");

  // Write Approved Staging CSV
  const stagedHeader =
    "name,title,specialty,hospital,city,district,address,phone,officialWebsite,description,source,externalRef,lastVerifiedAt\n";
  const stagedLines = approvedStagedRows.map((r) => {
    const esc = (val: string | null) => (val ? `"${val.replace(/"/g, '""')}"` : "");
    return [
      esc(r.name),
      esc(r.title),
      esc(r.specialty),
      esc(r.hospital),
      esc(r.city),
      esc(r.district),
      esc(r.address),
      esc(r.phone),
      esc(r.officialWebsite),
      esc(r.description),
      esc(r.source),
      esc(r.externalRef),
      esc(r.lastVerifiedAt),
    ].join(",");
  });

  fs.writeFileSync(
    "data/imports/alumas_experts_phase2_VERIFIED_STAGED.csv",
    stagedHeader + stagedLines.join("\n"),
    "utf-8"
  );
  console.log("Updated approved staging CSV: data/imports/alumas_experts_phase2_VERIFIED_STAGED.csv");

  // Source-by-Province Reconciliation
  const geoBreakdown: Record<string, Record<string, number>> = {};
  const sourceTotals: Record<string, number> = {};
  const cityTotals: Record<string, number> = {};

  for (const row of approvedStagedRows) {
    const city = row.city;
    const src = row.source;
    if (!geoBreakdown[city]) geoBreakdown[city] = {};
    geoBreakdown[city][src] = (geoBreakdown[city][src] || 0) + 1;
    sourceTotals[src] = (sourceTotals[src] || 0) + 1;
    cityTotals[city] = (cityTotals[city] || 0) + 1;
  }

  console.log("\n================ PROGRAMMATIC GEOGRAPHY RECONCILIATION ================");
  console.table(geoBreakdown);
  console.log("Source Totals:", sourceTotals);
  console.log("City Totals:", cityTotals);

  // Output markdown table for report
  const sortedCities = Object.keys(cityTotals).sort((a, b) => cityTotals[b] - cityTotals[a]);
  const tableRows: string[] = [];
  tableRows.push("| İl | Hospitadent (Diş) | Acıbadem (Hastane) | Medicana (Hastane) | Toplam Onaylı |");
  tableRows.push("| :--- | :---: | :---: | :---: | :---: |");
  for (const c of sortedCities) {
    const h = geoBreakdown[c]?.["SRC-HOSPITADENT-01"] || 0;
    const a = geoBreakdown[c]?.["SRC-ACIBADEM-01"] || 0;
    const m = geoBreakdown[c]?.["SRC-MEDICANA-01"] || 0;
    const tot = h + a + m;
    tableRows.push(`| **${c}** | ${h} | ${a} | ${m} | **${tot}** |`);
  }
  const hTot = sourceTotals["SRC-HOSPITADENT-01"] || 0;
  const aTot = sourceTotals["SRC-ACIBADEM-01"] || 0;
  const mTot = sourceTotals["SRC-MEDICANA-01"] || 0;
  tableRows.push(`| **TOPLAM** | **${hTot}** | **${aTot}** | **${mTot}** | **${approvedStagedRows.length}** |`);

  fs.writeFileSync("scripts/reconciled_geo_table.md", tableRows.join("\n"), "utf-8");
  console.log("\nGenerated markdown table saved to scripts/reconciled_geo_table.md");
}

reconcileAndStage().catch((err) => {
  console.error("FATAL ERROR during reconciliation:", err);
  process.exit(1);
});
