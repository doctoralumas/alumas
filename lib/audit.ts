import { createHash } from "node:crypto";
import { prisma } from "./prisma";

function requestIp(req?: Request) {
  if (!req) return null;
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}
function hash(value: string | null) {
  return value ? createHash("sha256").update(`${process.env.AUDIT_HASH_SALT || "alumas"}:${value}`).digest("hex") : null;
}
export async function audit(input:{actorUserId?:string|null;action:string;entityType:string;entityId?:string|null;outcome?:string;metadata?:Record<string,unknown>;req?:Request}) {
  try {
    await prisma.auditLog.create({data:{
      actorUserId:input.actorUserId || null, action:input.action, entityType:input.entityType,
      entityId:input.entityId || null, outcome:input.outcome || "success", metadata:input.metadata || undefined,
      ipHash:hash(requestIp(input.req)), userAgent:input.req?.headers.get("user-agent")?.slice(0,500) || null
    }});
  } catch (e) { console.error("audit_log_failed", e); }
}
