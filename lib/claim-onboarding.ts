const DISALLOWED_RETURN_PREFIXES = [
  "/login",
  "/register",
  "/pro/login",
  "/pro/register",
  "/phone-login",
  "/api",
];

/**
 * Validates that a claim ID parameter is a safe slug or CUID/ID token.
 */
export function sanitizeClaimDirectoryId(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 100) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export const sanitizeClaimDoctorId = sanitizeClaimDirectoryId;

/**
 * Validates and normalizes an internal return URL (`next` parameter).
 * Strictly prevents open redirects (`//evil.com`, `https://evil.com`, `javascript:...`, `\\evil.com`)
 * and prevents redirect loops back onto authentication pages.
 */
export function sanitizeInternalReturnUrl(rawNext: string | null | undefined): string | null {
  if (typeof rawNext !== "string") return null;
  const cleaned = rawNext.replace(/[\u0000-\u001F\u007F]+/g, "").trim();
  if (!cleaned) return null;

  // Must start with a single forward slash and an alphanumeric path segment, never `//` or `/\`
  if (!cleaned.startsWith("/") || cleaned.startsWith("//") || cleaned.includes("\\")) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(cleaned, "https://alumas.internal");
  } catch {
    return null;
  }

  if (parsed.origin !== "https://alumas.internal") return null;
  if (parsed.username || parsed.password) return null;
  if (!/^\/[a-zA-Z0-9]/.test(parsed.pathname)) return null;

  const lowerPath = parsed.pathname.toLowerCase();
  for (const prefix of DISALLOWED_RETURN_PREFIXES) {
    if (lowerPath === prefix || lowerPath.startsWith(`${prefix}/`) || lowerPath.startsWith(`${prefix}?`)) {
      return null;
    }
  }

  return `${parsed.pathname}${parsed.search}`;
}

/**
 * Resolves the post-authentication destination URL, prioritizing any active institution or doctor claim
 * or validated internal `next` return URL.
 */
export function resolvePostAuthDestination(options: {
  mode: "login" | "register";
  accountType?: string | null;
  claimDirectoryId?: string | null;
  claimDoctorId?: string | null;
  next?: string | null;
}): string {
  const safeDoctorClaimId = sanitizeClaimDoctorId(options.claimDoctorId);
  if (safeDoctorClaimId) {
    return `/onboarding/doctor?claimDoctorId=${encodeURIComponent(safeDoctorClaimId)}`;
  }

  const safeClaimId = sanitizeClaimDirectoryId(options.claimDirectoryId);
  const safeNext = sanitizeInternalReturnUrl(options.next);

  if (safeClaimId) {
    if (safeNext && safeNext.startsWith("/business/apply")) {
      const parsed = new URL(safeNext, "https://alumas.internal");
      if (!parsed.searchParams.get("claimDirectoryId")) {
        parsed.searchParams.set("claimDirectoryId", safeClaimId);
      }
      return `${parsed.pathname}${parsed.search}`;
    }
    return `/business/apply?claimDirectoryId=${encodeURIComponent(safeClaimId)}`;
  }

  if (safeNext) {
    return safeNext;
  }

  if (options.mode === "register") {
    const kind = String(options.accountType || "PATIENT").toUpperCase();
    if (kind === "DOCTOR") return "/onboarding/doctor";
    if (kind === "ORGANIZATION") return "/business/apply";
    if (kind === "IMAGING_CENTER" || kind === "LABORATORY") {
      return `/business/apply?type=${encodeURIComponent(kind)}`;
    }
    if (kind === "AGENCY") return "/agency/apply";
  }

  if (options.accountType) {
    const role = String(options.accountType).toUpperCase();
    if (role === "DOCTOR") return "/doctor";
    if (role === "ORGANIZATION") return "/business";
    if (role === "ADMIN") return "/admin";
    if (role === "AGENCY") return "/agency";
  }

  return "/profile";
}

/**
 * Builds an internal authentication link while preserving `claimDirectoryId`, `claimDoctorId`, `next`, and `type`.
 */
export function buildAuthHref(
  basePath: "/login" | "/register" | "/pro/login" | "/pro/register" | "/phone-login",
  params: {
    claimDirectoryId?: string | null;
    claimDoctorId?: string | null;
    next?: string | null;
    type?: string | null;
  }
): string {
  const sp = new URLSearchParams();
  const safeClaimId = sanitizeClaimDirectoryId(params.claimDirectoryId);
  const safeDoctorClaimId = sanitizeClaimDoctorId(params.claimDoctorId);
  const safeNext = sanitizeInternalReturnUrl(params.next);
  const safeType = typeof params.type === "string" && params.type.trim() ? params.type.trim() : null;

  if (safeDoctorClaimId) {
    sp.set("claimDoctorId", safeDoctorClaimId);
    if (!safeType) sp.set("type", "doctor");
  } else if (safeType) {
    sp.set("type", safeType);
  } else if (safeClaimId && (basePath === "/pro/register" || basePath === "/register")) {
    sp.set("type", "organization");
  }

  if (safeClaimId) {
    sp.set("claimDirectoryId", safeClaimId);
  }

  if (safeNext) {
    sp.set("next", safeNext);
  } else if (safeDoctorClaimId) {
    sp.set("next", `/onboarding/doctor?claimDoctorId=${safeDoctorClaimId}`);
  } else if (safeClaimId) {
    sp.set("next", `/business/apply?claimDirectoryId=${safeClaimId}`);
  }

  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
