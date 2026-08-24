import { requiredDocsFor } from "./document-requirements";
import type { ProfessionalAccountTypeKey } from "./account-config";

export function documentExpired(expiresAt?:Date|string|null){
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now();
}

export function verificationReadiness(account:any){
  const req=requiredDocsFor(account.accountType as ProfessionalAccountTypeKey);
  const approved=account.documents||[];
  const missing=req.filter(r=>r.required && !approved.some((d:any)=>
    d.documentType===r.type && d.status==="APPROVED" && !documentExpired(d.expiresAt)
  ));
  return {
    ready:missing.length===0,
    missing:missing.map(x=>({type:x.type,label:x.label})),
    expired:approved.filter((d:any)=>documentExpired(d.expiresAt)).map((d:any)=>d.id)
  };
}
