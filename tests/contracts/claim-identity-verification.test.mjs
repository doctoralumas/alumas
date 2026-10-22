import test from "node:test";
import assert from "node:assert/strict";
import { evaluateClaimIdentityMatch } from "../../lib/claim-identity-verification.ts";

test("Claim Identity Verification Contract", async (t) => {
  await t.test("Hard mismatch: Abuzer Eczanesi vs Prof. Dr. A. Bülent Oktay must be rejected", () => {
    const res = evaluateClaimIdentityMatch("Abuzer Eczanesi", "Prof. Dr. A. Bülent Oktay");
    assert.equal(res.matches, false);
    assert.equal(res.confidence, "MISMATCH");
    assert.match(res.reason || "", /Soyadı uyuşmuyor/);
    assert.equal(res.mismatchCode, "SURNAME_MISMATCH");
    assert.equal(res.mismatchDetails?.applicantSurname, "Eczanesi");
    assert.equal(res.mismatchDetails?.targetSurname, "Oktay");
  });

  await t.test("Exact match: identical names with honorifics stripped", () => {
    const res = evaluateClaimIdentityMatch("A. Bülent Oktay", "Prof. Dr. A. Bülent Oktay");
    assert.equal(res.matches, true);
    assert.equal(res.confidence, "EXACT");
  });

  await t.test("Compatible match: Given name Ahmet matches initial A. with matching surname", () => {
    const res = evaluateClaimIdentityMatch("Ahmet Bülent Oktay", "Prof. Dr. A. Bülent Oktay");
    assert.equal(res.matches, true);
    assert.equal(res.confidence, "COMPATIBLE");
  });

  await t.test("Compatible match: Given name Bülent with matching surname", () => {
    const res = evaluateClaimIdentityMatch("Bülent Oktay", "Prof. Dr. A. Bülent Oktay");
    assert.equal(res.matches, true);
    assert.equal(res.confidence, "COMPATIBLE");
  });

  await t.test("Surname mismatch must fail even if given name matches", () => {
    const res = evaluateClaimIdentityMatch("Bülent Yılmaz", "Prof. Dr. A. Bülent Oktay");
    assert.equal(res.matches, false);
    assert.equal(res.confidence, "MISMATCH");
  });

  await t.test("Random unrelated applicant must be rejected", () => {
    const res = evaluateClaimIdentityMatch("Mehmet Demir", "Prof. Dr. A. Bülent Oktay");
    assert.equal(res.matches, false);
    assert.equal(res.confidence, "MISMATCH");
  });
});

