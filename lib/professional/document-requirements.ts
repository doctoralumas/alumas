import type { ProfessionalAccountTypeKey } from "./account-config";

export type RequiredDocument = {
  type:
    | "IDENTITY"
    | "MEDICAL_LICENSE"
    | "SPECIALTY_CERTIFICATE"
    | "FACILITY_LICENSE"
    | "HEALTH_TOURISM_AUTHORIZATION"
    | "TAX_CERTIFICATE"
    | "TRADE_REGISTRY"
    | "OTHER";
  label:string;
  required:boolean;
  expires:boolean;
};

export const REQUIRED_DOCUMENTS:Record<ProfessionalAccountTypeKey,RequiredDocument[]>={
  DOCTOR:[
    {type:"IDENTITY",label:"Kimlik doğrulama belgesi",required:true,expires:false},
    {type:"MEDICAL_LICENSE",label:"Diploma / hekimlik belgesi",required:true,expires:false},
    {type:"SPECIALTY_CERTIFICATE",label:"Uzmanlık belgesi",required:false,expires:false}
  ],
  HOSPITAL:[
    {type:"FACILITY_LICENSE",label:"Sağlık tesisi ruhsatı / faaliyet belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Ticaret sicil / kurum kayıt belgesi",required:true,expires:false},
    {type:"TAX_CERTIFICATE",label:"Vergi levhası",required:true,expires:false}
  ],
  CLINIC:[
    {type:"FACILITY_LICENSE",label:"Klinik ruhsatı / faaliyet belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Ticaret sicil / kurum kayıt belgesi",required:true,expires:false}
  ],
  PRACTICE:[
    {type:"FACILITY_LICENSE",label:"Muayenehane ruhsatı / uygunluk belgesi",required:true,expires:true},
    {type:"MEDICAL_LICENSE",label:"Sorumlu hekimin diploma / hekimlik belgesi",required:true,expires:false}
  ],
  PHARMACY:[
    {type:"FACILITY_LICENSE",label:"Eczane ruhsatı",required:true,expires:true},
    {type:"MEDICAL_LICENSE",label:"Sorumlu eczacı mesleki belgesi",required:true,expires:false}
  ],
  LABORATORY:[
    {type:"FACILITY_LICENSE",label:"Laboratuvar ruhsatı / faaliyet belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Kurum kayıt belgesi",required:true,expires:false}
  ],
  IMAGING_CENTER:[
    {type:"FACILITY_LICENSE",label:"Görüntüleme merkezi ruhsatı / faaliyet belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Kurum kayıt belgesi",required:true,expires:false}
  ],
  HOME_HEALTH:[
    {type:"FACILITY_LICENSE",label:"Evde sağlık hizmeti yetki / faaliyet belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Kurum kayıt belgesi",required:true,expires:false}
  ],
  HEALTH_TOURISM_AGENCY:[
    {type:"HEALTH_TOURISM_AUTHORIZATION",label:"Uluslararası sağlık turizmi yetki belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Ticaret sicil / kurum kayıt belgesi",required:true,expires:false},
    {type:"TAX_CERTIFICATE",label:"Vergi levhası",required:true,expires:false}
  ],
  OTHER_HEALTH_ORGANIZATION:[
    {type:"FACILITY_LICENSE",label:"Faaliyet / yetki belgesi",required:true,expires:true},
    {type:"TRADE_REGISTRY",label:"Kurum kayıt belgesi",required:true,expires:false}
  ]
};

export function requiredDocsFor(type:ProfessionalAccountTypeKey){
  return REQUIRED_DOCUMENTS[type]||[];
}
