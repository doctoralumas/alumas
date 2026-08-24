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
export function normalizePhone(v: unknown) { return String(v || "").replace(/[^+\d]/g, "").slice(0, 20); }
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
