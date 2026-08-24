export const PROFESSIONAL_ACCOUNT_CONFIG = {
  DOCTOR: { label:"Doktor", modules:["profile","verification","appointments","patients","messages","schedule","organizations"] },
  HOSPITAL: { label:"Hastane", modules:["profile","verification","branches","departments","doctors","services","appointments","insurance","messages"] },
  CLINIC: { label:"Klinik", modules:["profile","verification","doctors","services","appointments","schedule","insurance","messages"] },
  PRACTICE: { label:"Muayenehane", modules:["profile","verification","services","appointments","schedule","insurance","messages"] },
  PHARMACY: { label:"Eczane", modules:["profile","verification","hours","duty","location","services","messages"] },
  LABORATORY: { label:"Laboratuvar", modules:["profile","verification","services","appointments","results","messages"] },
  IMAGING_CENTER: { label:"Görüntüleme Merkezi", modules:["profile","verification","services","appointments","results","messages"] },
  HOME_HEALTH: { label:"Evde Sağlık", modules:["profile","verification","serviceAreas","services","requests","teams","messages"] },
  HEALTH_TOURISM_AGENCY: { label:"Sağlık Turizmi Acentesi", modules:["profile","verification","healthTourismAuthorization","packages","partners","hotels","transfers","leads","messages"] },
  OTHER_HEALTH_ORGANIZATION: { label:"Diğer Sağlık Kuruluşu", modules:["profile","verification","services","appointments","messages"] }
} as const;

export type ProfessionalAccountTypeKey=keyof typeof PROFESSIONAL_ACCOUNT_CONFIG;

export function canOperate(status:string){
  return status==="APPROVED";
}
export function agencyCanOperate(account:any){
  return account?.accountType==="HEALTH_TOURISM_AGENCY" &&
    account?.verificationStatus==="APPROVED" &&
    account?.healthTourism?.status==="APPROVED" &&
    (!account.healthTourism.expiresAt || new Date(account.healthTourism.expiresAt)>new Date());
}
