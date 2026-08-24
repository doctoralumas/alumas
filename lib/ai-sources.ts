import type {MedicalEvidence} from "@/lib/ai/medical-knowledge";

export type AiSource = {
  id: string;
  label: string;
  kind: "verified_profile" | "availability" | "organization_registry" | "navigation_rule" | "medical_knowledge";
  authority: "internal_verified" | "curated_rule" | "external_medical";
  description: string;
  publisher?: string;
  url?: string;
  verifiedAt?: string | null;
};

export function buildNavigationSources(opts: {
  hasDoctors: boolean;
  hasOrganizations: boolean;
  hasAvailability: boolean;
  matchedSpecialty: boolean;
  evidence?: MedicalEvidence[];
}): AiSource[] {
  const sources: AiSource[] = [];
  if (opts.matchedSpecialty) sources.push({
    id:"alumas-navigation-rules-v3", label:"Alumas branş yönlendirme kuralları", kind:"navigation_rule", authority:"curated_rule",
    description:"Kullanıcı ifadesini başlangıç branşı/hizmet türüyle eşleştiren kontrollü yönlendirme kuralları. Tanı üretmez.", verifiedAt:"2026-08-24"
  });
  if (opts.hasDoctors) sources.push({
    id:"alumas-verified-doctors", label:"Alumas doğrulanmış doktor profilleri", kind:"verified_profile", authority:"internal_verified",
    description:"Yalnız isVerified=true ve isPublished=true olan doktor profilleri sonuçlara dahil edilir."
  });
  if (opts.hasAvailability) sources.push({
    id:"alumas-live-availability", label:"Alumas randevu müsaitlik kayıtları", kind:"availability", authority:"internal_verified",
    description:"Gösterilen saatler aktif, gelecekteki randevu müsaitlik kayıtlarından alınır."
  });
  if (opts.hasOrganizations) sources.push({
    id:"alumas-approved-organizations", label:"Alumas onaylı sağlık kurumu kayıtları", kind:"organization_registry", authority:"internal_verified",
    description:"Yalnız APPROVED ve isPublished=true hastane, klinik ve eczane kayıtları listelenir."
  });
  for (const item of opts.evidence || []) sources.push({
    id:item.id, label:item.title, kind:"medical_knowledge", authority:"external_medical", description:item.statement,
    publisher:item.publisher, url:item.url, verifiedAt:item.reviewedAt
  });
  return sources;
}
