export type IdentityMatchConfidence = "EXACT" | "COMPATIBLE" | "MISMATCH";
export type IdentityMismatchCode = "SURNAME_MISMATCH" | "GIVEN_NAME_MISMATCH" | "MISSING_NAME";

export interface IdentityMatchResult {
  matches: boolean;
  confidence: IdentityMatchConfidence;
  cleanApplicant: string;
  cleanTarget: string;
  reason?: string;
  mismatchCode?: IdentityMismatchCode;
  mismatchDetails?: {
    applicantSurname?: string;
    targetSurname?: string;
    applicantGiven?: string;
    targetGiven?: string;
  };
}

/**
 * Strips known medical/specialist titles and honorifics from a name for clean matching.
 */
export function cleanProfessionalName(rawName: string | null | undefined): string {
  if (!rawName) return "";
  let current = rawName;
  let prev = "";
  const titleRegex = /(?:^|\s+)(prof\s*\.?\s*dr\s*\.?|doç\s*\.?\s*dr\s*\.?|doc\s*\.?\s*dr\s*\.?|uzm\s*\.?\s*dr\s*\.?|op\s*\.?\s*dr\s*\.?|dr\s*\.?|uzm\s*\.?\s*dt\s*\.?|dt\s*\.?|uzm\s*\.?\s*dyt\s*\.?|dyt\s*\.?|uzm\s*\.?\s*fzt\s*\.?|fzt\s*\.?|uzm\s*\.?\s*psk\s*\.?|psk\s*\.?|klinik\s+psk\s*\.?)(?=\s+|$)/giu;

  while (current !== prev) {
    prev = current;
    current = current.replace(titleRegex, " ");
  }

  return current
    .replace(/^[\s.,;:\-]+|[\s.,;:\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Turkish-aware text key normalizer that strips accents and symbols into hyphen-separated alphanumeric tokens.
 */
export function normalizeTextKey(value: string | null | undefined): string {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Tokenizes and normalizes a person's name into clean lowercase words.
 */
export function tokenizeName(name: string): string[] {
  const cleaned = cleanProfessionalName(name);
  const normalized = normalizeTextKey(cleaned);
  return normalized
    .split("-")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Evaluates whether an applicant user's legal/account name is legitimately compatible
 * with a target DirectoryDoctor name.
 * 
 * Strict invariants:
 * 1. An unrelated name (e.g. "Abuzer Eczanesi" vs "A. Bülent Oktay") is a hard MISMATCH.
 * 2. Academic / medical titles (Prof., Dr., Uzm., Dt., etc.) are stripped prior to comparison.
 * 3. Initial matching is supported (e.g. "Ahmet Bülent Oktay" matches "A. Bülent Oktay").
 * 4. Last names MUST match.
 */
export function evaluateClaimIdentityMatch(
  applicantName: string | null | undefined,
  targetDoctorName: string | null | undefined
): IdentityMatchResult {
  const applicantRaw = String(applicantName || "").trim();
  const targetRaw = String(targetDoctorName || "").trim();

  const cleanApplicant = cleanProfessionalName(applicantRaw);
  const cleanTarget = cleanProfessionalName(targetRaw);

  const appTokens = tokenizeName(applicantRaw);
  const targetTokens = tokenizeName(targetRaw);

  // Extract original tokens with genuine casing & characters (e.g. "Eczanesi", "Oktay")
  const originalAppTokens = cleanApplicant.split(/\s+/).filter(Boolean);
  const originalTargetTokens = cleanTarget.split(/\s+/).filter(Boolean);

  if (appTokens.length === 0 || targetTokens.length === 0) {
    return {
      matches: false,
      confidence: "MISMATCH",
      cleanApplicant,
      cleanTarget,
      reason: "İsim bilgisi eksik veya geçersiz.",
      mismatchCode: "MISSING_NAME",
    };
  }

  // Exact token match
  if (appTokens.join(" ") === targetTokens.join(" ")) {
    return {
      matches: true,
      confidence: "EXACT",
      cleanApplicant,
      cleanTarget,
    };
  }

  const appSurname = appTokens[appTokens.length - 1];
  const targetSurname = targetTokens[targetTokens.length - 1];

  const originalAppSurname = originalAppTokens[originalAppTokens.length - 1] || appSurname;
  const originalTargetSurname = originalTargetTokens[originalTargetTokens.length - 1] || targetSurname;

  // Surname must match
  if (appSurname !== targetSurname) {
    return {
      matches: false,
      confidence: "MISMATCH",
      cleanApplicant,
      cleanTarget,
      reason: `Soyadı uyuşmuyor: '${originalAppSurname}' ile '${originalTargetSurname}'.`,
      mismatchCode: "SURNAME_MISMATCH",
      mismatchDetails: {
        applicantSurname: originalAppSurname,
        targetSurname: originalTargetSurname,
      },
    };
  }

  // Check first/middle names and initials
  const appFirstNames = appTokens.slice(0, -1);
  const targetFirstNames = targetTokens.slice(0, -1);

  // Check if at least one given name matches or is a matching initial
  let hasGivenNameMatch = false;
  for (const aName of appFirstNames) {
    for (const tName of targetFirstNames) {
      if (aName === tName) {
        hasGivenNameMatch = true;
        break;
      }
      // Single letter initial match (e.g. "a" matches "ahmet")
      if (
        (aName.length === 1 && tName.startsWith(aName)) ||
        (tName.length === 1 && aName.startsWith(tName))
      ) {
        hasGivenNameMatch = true;
        break;
      }
    }
    if (hasGivenNameMatch) break;
  }

  if (hasGivenNameMatch) {
    return {
      matches: true,
      confidence: "COMPATIBLE",
      cleanApplicant,
      cleanTarget,
    };
  }

  const originalAppGiven = originalAppTokens.slice(0, -1).join(" ") || cleanApplicant;
  const originalTargetGiven = originalTargetTokens.slice(0, -1).join(" ") || cleanTarget;

  return {
    matches: false,
    confidence: "MISMATCH",
    cleanApplicant,
    cleanTarget,
    reason: `Ad bilgisi hedef hekimle eşleşmiyor: '${cleanApplicant}' ile '${cleanTarget}'.`,
    mismatchCode: "GIVEN_NAME_MISMATCH",
    mismatchDetails: {
      applicantGiven: originalAppGiven,
      targetGiven: originalTargetGiven,
    },
  };
}

