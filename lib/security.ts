import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export function requestIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}
export function securityHash(value: string | null | undefined) {
  if (!value) return null;
  const salt = process.env.SECURITY_HASH_SALT || process.env.AUDIT_HASH_SALT || "alumas-dev";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}
export function normalizeEmail(v: unknown) { return String(v || "").trim().toLowerCase(); }
export function normalizePhone(v: unknown): string {
  if (!v || (typeof v !== "string" && typeof v !== "number")) return "";
  const str = String(v).trim();
  if (!str) return "";

  const startsWithPlus = str.startsWith("+");
  const startsWithZeroZero = str.startsWith("00");

  // Strip all non-digit characters
  const digits = str.replace(/\D/g, "");
  if (!digits) return "";

  // Case 1: Turkish numbers with explicit 0090 or +90 or 90
  if (startsWithZeroZero && digits.startsWith("0090")) {
    const after90 = digits.slice(4);
    const sub = after90.startsWith("0") ? after90.slice(1) : after90;
    if (sub.length === 10) return `+90${sub}`;
  }
  if ((startsWithPlus || digits.startsWith("90")) && digits.startsWith("90")) {
    const after90 = digits.slice(2);
    const sub = after90.startsWith("0") ? after90.slice(1) : after90;
    if (sub.length === 10) return `+90${sub}`;
  }

  // Case 2: Turkish national numbers (11 digits starting with 0, or 10 digits starting with 5)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+90${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    return `+90${digits}`;
  }

  // Case 3: International numbers starting with + or 00
  if (startsWithPlus) {
    if (digits.length >= 8 && digits.length <= 15) {
      return `+${digits}`;
    }
  }
  if (startsWithZeroZero && digits.length >= 10 && digits.length <= 17) {
    const without00 = digits.slice(2);
    if (without00.length >= 8 && without00.length <= 15) {
      return `+${without00}`;
    }
  }

  // Default fallback for valid digit sequences (E.164 format)
  if (digits.length === 10) {
    return `+90${digits}`;
  }
  return `+${digits.slice(0, 15)}`;
}

export function isValidPhone(v: unknown): boolean {
  const norm = normalizePhone(v);
  if (!norm || !norm.startsWith("+")) return false;
  const digits = norm.slice(1);
  if (digits.length < 8 || digits.length > 15) return false;
  if (norm.startsWith("+90")) {
    return norm.length === 13;
  }
  return true;
}

export function getPhoneLookupVariants(v: unknown): string[] {
  const canonical = normalizePhone(v);
  if (!canonical) return [];
  const variants = new Set<string>();
  variants.add(canonical);

  if (canonical.startsWith("+90") && canonical.length === 13) {
    const subscriber = canonical.slice(3);
    variants.add(subscriber);
    variants.add(`0${subscriber}`);
    variants.add(`90${subscriber}`);
  } else if (canonical.startsWith("+")) {
    variants.add(canonical.slice(1));
  }
  return Array.from(variants);
}

export function formatDisplayPhone(raw: unknown): string {
  const norm = normalizePhone(raw);
  if (!norm) return String(raw || "");
  if (norm.startsWith("+90") && norm.length === 13) {
    const s = norm.slice(3);
    return `0${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 8)} ${s.slice(8, 10)}`;
  }
  if (norm.startsWith("+")) {
    const cc = norm.slice(1, 3);
    const rest = norm.slice(3);
    return `+${cc} ${rest}`;
  }
  return norm;
}
export function passwordPolicy(password: unknown) {
  const p = String(password || "");
  if (p.length < 10) return "Parola en az 10 karakter olmalı.";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Parola en az bir harf ve bir rakam içermeli.";
  return null;
}
export async function loginThrottle(req: Request, subject: string) {
  const since = new Date(Date.now() - 15 * 60_000);
  const subjectHash = securityHash(subject)!; const ipHash = securityHash(requestIp(req));
  const [bySubject, byIp] = await Promise.all([
    prisma.loginAttempt.count({where:{subjectHash,success:false,createdAt:{gt:since}}}),
    ipHash ? prisma.loginAttempt.count({where:{ipHash,success:false,createdAt:{gt:since}}}) : Promise.resolve(0)
  ]);
  return { blocked: bySubject >= 8 || byIp >= 20, subjectHash, ipHash };
}
export async function recordLoginAttempt(subjectHash:string, ipHash:string|null, success:boolean) {
  await prisma.loginAttempt.create({data:{subjectHash,ipHash,success}}).catch(()=>{});
  if (Math.random() < 0.03) await prisma.loginAttempt.deleteMany({where:{createdAt:{lt:new Date(Date.now()-30*86400000)}}}).catch(()=>{});
}
