export type ReleaseChannel = "development"|"staging"|"rc"|"production";

const TRUE_VALUES = new Set(["1","true","yes","on","enabled"]);

export function envBool(name:string, fallback=false){
  const raw=process.env[name];
  if(raw==null||raw==="") return fallback;
  return TRUE_VALUES.has(raw.trim().toLowerCase());
}

export function appVersion(){
  return process.env.APP_VERSION || process.env.npm_package_version || "0.31.0";
}
export function buildSha(){return process.env.BUILD_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "dev";}
export function releaseChannel():ReleaseChannel{
  const raw=(process.env.RELEASE_CHANNEL || process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
  if(raw==="production") return "production";
  if(raw==="staging") return "staging";
  if(raw==="rc") return "rc";
  return "development";
}
export function maintenanceEnabled(){return envBool("MAINTENANCE_MODE",false);}

const PUBLIC_FLAGS = [
  "videoConsultation","healthTourism","homeCare","familyAccess","emergencyDirectory",
  "campaigns","insurance","healthIntegrations","organizationMarketplace"
] as const;
export type PublicFeatureFlag = typeof PUBLIC_FLAGS[number];
const ENV_BY_FLAG:Record<PublicFeatureFlag,string>={
  videoConsultation:"FEATURE_VIDEO_CONSULTATION",
  healthTourism:"FEATURE_HEALTH_TOURISM",
  homeCare:"FEATURE_HOME_CARE",
  familyAccess:"FEATURE_FAMILY_ACCESS",
  emergencyDirectory:"FEATURE_EMERGENCY_DIRECTORY",
  campaigns:"FEATURE_CAMPAIGNS",
  insurance:"FEATURE_INSURANCE",
  healthIntegrations:"FEATURE_HEALTH_INTEGRATIONS",
  organizationMarketplace:"FEATURE_ORGANIZATION_MARKETPLACE"
};
export function publicFeatureFlags(){
  return Object.fromEntries(PUBLIC_FLAGS.map(flag=>[flag,envBool(ENV_BY_FLAG[flag],true)])) as Record<PublicFeatureFlag,boolean>;
}
export function isFeatureEnabled(flag:PublicFeatureFlag){return publicFeatureFlags()[flag];}
