const FORBIDDEN_SCHEMES = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
  "ftp:",
  "mailto:",
  "tel:",
  "ws:",
  "wss:",
  "about:",
  "chrome:",
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "alumas.com",
  "www.alumas.com",
  "alumas.app",
  "www.alumas.app",
]);

function isPrivateOrRawIpHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (!lower) return true;
  if (lower.startsWith("[") || lower.includes(":")) return true; // IPv6 literal
  // Check IPv4 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(lower)) return true;
  if (lower.endsWith(".local") || lower.endsWith(".internal") || lower.endsWith(".localhost")) {
    return true;
  }
  return false;
}

function hasValidPublicDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (BLOCKED_HOSTNAMES.has(lower)) return false;
  if (isPrivateOrRawIpHost(lower)) return false;
  // Must have at least one dot and valid DNS labels
  const parts = lower.split(".");
  if (parts.length < 2) return false;
  for (const part of parts) {
    if (!part || part.length > 63) return false;
    if (!/^[a-z0-9-]+$/i.test(part)) return false;
    if (part.startsWith("-") || part.endsWith("-")) return false;
  }
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) return false;
  return true;
}

/**
 * Validates and normalizes an external official website URL.
 * - Rejects unsafe schemes (javascript:, data:, file:, etc.)
 * - Rejects embedded credentials (user:pass@host)
 * - Rejects localhost, private IPs, raw IPs, URL shorteners, and internal ALUMAS hosts
 * - Enforces HTTPS scheme
 * - Returns null if the URL cannot be safely validated
 */
export function normalizeOfficialWebsiteUrl(rawUrl: string | null | undefined): string | null {
  if (typeof rawUrl !== "string") return null;
  const cleaned = rawUrl.replace(/[\u0000-\u001F\u007F]+/g, "").trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  for (const scheme of FORBIDDEN_SCHEMES) {
    if (lower.startsWith(scheme)) return null;
  }

  // Reject protocol-relative URLs or whitespace inside URL
  if (cleaned.startsWith("//") || /\s/.test(cleaned)) {
    return null;
  }

  let candidate = cleaned;
  if (/^http:\/\//i.test(candidate)) {
    candidate = candidate.replace(/^http:\/\//i, "https://");
  } else if (!/^https:\/\//i.test(candidate)) {
    if (candidate.includes("://")) {
      // Unknown scheme
      return null;
    }
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  if (!hasValidPublicDomain(parsed.hostname)) return null;

  // Strip any suspicious hash/javascript payloads in hash
  if (parsed.hash && /javascript:|data:/i.test(parsed.hash)) {
    parsed.hash = "";
  }

  return parsed.toString();
}

export function isSafeOfficialWebsiteUrl(rawUrl: string | null | undefined): boolean {
  return normalizeOfficialWebsiteUrl(rawUrl) !== null;
}

