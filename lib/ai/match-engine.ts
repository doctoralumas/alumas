export type ContextualMatchInput = {
  specialtyMatch: number;
  distanceKm?: number | null;
  hasAvailabilityToday?: boolean;
  nextAvailableHours?: number | null;
  verificationScore?: number;
  organizationPublished?: boolean;
  organizationOpenNow?: boolean | null;
  organizationOnDuty?: boolean;
  insuranceMatch?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
};

export type ContextualMatchBreakdown = {
  total: number;
  specialty: number;
  proximity: number;
  availability: number;
  verification: number;
  organization: number;
  insurance: number | null;
  quality: number;
  reasons: string[];
};

const clamp01=(n:number)=>Math.max(0,Math.min(1,n));

function proximityScore(distanceKm?: number|null){
  if(distanceKm == null) return 0.5;
  if(distanceKm <= 2) return 1;
  if(distanceKm <= 5) return 0.92;
  if(distanceKm <= 10) return 0.78;
  if(distanceKm <= 20) return 0.58;
  if(distanceKm <= 40) return 0.32;
  return 0.1;
}

function availabilityScore(today?:boolean, hours?:number|null){
  if(today) return 1;
  if(hours == null) return .4;
  if(hours <= 24) return .9;
  if(hours <= 72) return .72;
  if(hours <= 168) return .55;
  return .3;
}

function qualityScore(rating?:number|null, reviewCount?:number|null){
  if(!rating) return 0.5;
  const ratingNorm = clamp01((rating-3)/2);
  const confidence = Math.min(1, Math.log10((reviewCount||0)+1)/2);
  return clamp01(ratingNorm*.72 + confidence*.28);
}

export function scoreContextualDoctorMatch(input: ContextualMatchInput): ContextualMatchBreakdown {
  const specialty = clamp01(input.specialtyMatch);
  const proximity = proximityScore(input.distanceKm);
  const availability = availabilityScore(input.hasAvailabilityToday,input.nextAvailableHours);
  const verification = clamp01(input.verificationScore ?? 1);
  const organization =
    input.organizationPublished === false ? .2 :
    input.organizationOnDuty ? 1 :
    input.organizationOpenNow === true ? .95 :
    input.organizationOpenNow === false ? .45 : .7;
  const insurance = input.insuranceMatch == null ? null : (input.insuranceMatch ? 1 : 0);
  const quality = qualityScore(input.rating,input.reviewCount);

  // Dynamic normalization: unknown insurance/open-state never unfairly penalizes a result.
  const factors = [
    [specialty, .35],
    [proximity, .15],
    [availability, .15],
    [verification, .08],
    [organization, .08],
    [quality, .06],
  ] as Array<[number,number]>;
  if(insurance !== null) factors.push([insurance,.13]);

  const denom=factors.reduce((s,[,w])=>s+w,0);
  const total=Math.round(100*factors.reduce((s,[v,w])=>s+v*w,0)/denom);

  const reasons:string[]=[];
  if(specialty>=.9) reasons.push("Branş eşleşmesi çok güçlü");
  else if(specialty>=.7) reasons.push("Branş eşleşmesi güçlü");
  if(proximity>=.9) reasons.push("Konumu çok yakın");
  else if(proximity>=.7) reasons.push("Konumu yakın");
  if(input.hasAvailabilityToday) reasons.push("Bugün müsait randevu var");
  else if(input.nextAvailableHours!=null && input.nextAvailableHours<=72) reasons.push("Yakın tarihte müsaitlik var");
  if(input.organizationOnDuty) reasons.push("Kurum/eczane nöbetçi");
  else if(input.organizationOpenNow===true) reasons.push("Kurum şu anda açık");
  if(input.insuranceMatch===true) reasons.push("Sigorta uyumu var");
  if((input.verificationScore??1)>=.9) reasons.push("Doğrulanmış hekim profili");
  if(quality>=.75) reasons.push("Güçlü kullanıcı değerlendirmesi");

  return {total,specialty,proximity,availability,verification,organization,insurance,quality,reasons};
}

export function normalizeSpecialtyMatch(target:string|undefined,candidate:string){
  if(!target) return .4;
  const a=target.toLocaleLowerCase("tr");
  const b=candidate.toLocaleLowerCase("tr");
  if(a===b) return 1;
  if(b.includes(a)||a.includes(b)) return .88;
  const ta=new Set(a.split(/\s+/).filter(Boolean));
  const tb=new Set(b.split(/\s+/).filter(Boolean));
  let common=0; for(const t of ta) if(tb.has(t)) common++;
  return Math.max(.35,common/Math.max(ta.size,1));
}
