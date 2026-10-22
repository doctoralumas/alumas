import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { execFileSync } from "node:child_process";

test("Admin Doctor List & Claim Localization Verification", async (t) => {
  const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
  const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

  await t.test("admin.doctorList namespace exists and has required keys in both TR and EN", () => {
    assert.ok(tr.admin?.doctorList, "tr.admin.doctorList must exist");
    assert.ok(en.admin?.doctorList, "en.admin.doctorList must exist");

    const requiredKeys = [
      "identityMismatchWarning",
      "identityMismatchDesc",
      "mismatchSurname",
      "mismatchGivenName",
      "mismatchMissingName",
      "overrideReasonMinLength",
      "documentsRejectedNotice",
      "documentsPendingNotice",
      "statusDocumentsRejected",
      "reasonCodes",
    ];

    for (const key of requiredKeys) {
      assert.ok(tr.admin.doctorList[key], `tr.admin.doctorList.${key} must be defined`);
      assert.ok(en.admin.doctorList[key], `en.admin.doctorList.${key} must be defined`);
    }

    assert.equal(
      tr.admin.doctorList.identityMismatchWarning,
      "Kimlik uyuşmazlığı tespit edildi"
    );
    assert.equal(
      en.admin.doctorList.identityMismatchWarning,
      "Identity mismatch detected"
    );
    assert.equal(
      tr.admin.doctorList.identityMismatchDesc,
      "Başvuru sahibinin kimlik bilgileri, sahiplenilmek istenen uzman profiliyle eşleşmiyor."
    );
    assert.equal(
      en.admin.doctorList.identityMismatchDesc,
      "The applicant's identity does not match the directory professional."
    );
  });

  await t.test("Runtime verification of structured mismatch, block reasons, and reviewer note formatting", () => {
    const inlineScript = `
      import assert from "node:assert/strict";
      import fs from "node:fs";
      import { evaluateClaimIdentityMatch } from "./lib/claim-identity-verification.ts";
      import { approvalBlockReason } from "./lib/verification-documents.ts";
      import { formatReviewerNote } from "./components/admin-verification-documents.tsx";

      const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
      const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

      // 1. Structured mismatch
      const match = evaluateClaimIdentityMatch("Abuzer Eczanesi", "Prof. Dr. A. Bülent Oktay");
      assert.equal(match.matches, false);
      assert.equal(match.mismatchCode, "SURNAME_MISMATCH");
      assert.equal(match.mismatchDetails?.applicantSurname, "Eczanesi");
      assert.equal(match.mismatchDetails?.targetSurname, "Oktay");

      // 2. Localized approvalBlockReason
      const docs = [
        { documentType: "IDENTITY", status: "REJECTED" },
        { documentType: "MEDICAL_LICENSE", status: "REJECTED" },
      ];
      const trReason = approvalBlockReason("doctor", null, docs, "tr");
      assert.match(trReason, /Onay için şu belgeler onaylı ve süresi geçerli olmalı/);
      assert.match(trReason, /Kimlik belgesi/);

      const enReason = approvalBlockReason("doctor", null, docs, "en");
      assert.match(enReason, /For approval, the following documents must be approved and currently valid/);
      assert.match(enReason, /Identity Document/);

      // 3. formatReviewerNote
      const rawNote = "REVOKED_TEST_CLAIM: Test doğrulaması iptal edildi.";
      const trNote = formatReviewerNote(rawNote, (code) => tr.admin.doctorList.reasonCodes[code] || \`[\${code}]\`);
      assert.equal(trNote, "[Test Talebi İptal Edildi]: Test doğrulaması iptal edildi.");

      const enNote = formatReviewerNote(rawNote, (code) => en.admin.doctorList.reasonCodes[code] || \`[\${code}]\`);
      assert.equal(enNote, "[Test Claim Revoked]: Test doğrulaması iptal edildi.");

      const freeText = "Doktor belgesi noter tasdikli olarak teyit edildi.";
      assert.equal(formatReviewerNote(freeText, () => "[CODE]"), freeText);
    `;

    execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", inlineScript], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
  });
});
