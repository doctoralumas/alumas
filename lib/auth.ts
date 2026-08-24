import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "alumas_session";
const SESSION_DAYS = 30;

export function hashPassword(password:string, salt=randomBytes(16).toString("hex")) {
  const derived = pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `${salt}:${derived}`;
}
export function verifyPassword(password:string, stored:string) {
  const [salt, hash] = stored.split(":");
  if(!salt || !hash) return false;
  const derived = pbkdf2Sync(password, salt, 210000, 32, "sha256");
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
export const tokenHash = (token:string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId:string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS*86400000);
  await prisma.session.create({data:{userId,tokenHash:tokenHash(token),expiresAt}});
  const jar = await cookies();
  await prisma.session.deleteMany({where:{userId,expiresAt:{lt:new Date()}}}).catch(()=>{});
  jar.set(SESSION_COOKIE, token, {httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",expires:expiresAt,priority:"high"});
}
export async function destroySession() {
  const jar=await cookies(); const token=jar.get(SESSION_COOKIE)?.value;
  if(token) await prisma.session.deleteMany({where:{tokenHash:tokenHash(token)}}).catch(()=>{});
  jar.delete(SESSION_COOKIE);
}
export async function currentUser() {
  if(!process.env.DATABASE_URL) return null;
  const token=(await cookies()).get(SESSION_COOKIE)?.value; if(!token) return null;
  const session=await prisma.session.findUnique({where:{tokenHash:tokenHash(token)},include:{user:{include:{doctorProfile:true}}}}).catch(()=>null);
  if(!session || session.expiresAt < new Date()) { if(session) await prisma.session.delete({where:{id:session.id}}).catch(()=>{}); return null; }
  return session.user;
}
