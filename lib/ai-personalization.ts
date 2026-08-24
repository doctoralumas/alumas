import {prisma} from "@/lib/prisma";

export type SafePersonalizationContext = {
  ageBand: string | null;
  activeConditions: string[];
  activeMedications: string[];
  activeAllergies: string[];
  activeSpecialProfiles: string[];
  locationHint: string | null;
  usedFields: string[];
};

function ageBand(birthDate: Date | null) {
  if (!birthDate) return null;
  const age = Math.max(0, Math.floor((Date.now() - birthDate.getTime()) / 31557600000));
  if (age < 13) return "0-12";
  if (age < 18) return "13-17";
  if (age < 40) return "18-39";
  if (age < 65) return "40-64";
  return "65+";
}

export async function buildSafePersonalizationContext(userId: string, locationHint: string | null): Promise<SafePersonalizationContext> {
  const user = await prisma.user.findUnique({
    where:{id:userId},
    select:{
      birthDate:true,
      medicalConditions:{where:{status:"active"},select:{name:true},take:12},
      medications:{where:{isActive:true},select:{name:true},take:12},
      allergies:{where:{isActive:true},select:{allergen:true,severity:true},take:12},
      specialHealthProfiles:{where:{isActive:true},select:{type:true},take:6},
    }
  });
  if (!user) return {ageBand:null,activeConditions:[],activeMedications:[],activeAllergies:[],activeSpecialProfiles:[],locationHint,usedFields:[]};
  const context = {
    ageBand: ageBand(user.birthDate),
    activeConditions:user.medicalConditions.map(x=>x.name),
    activeMedications:user.medications.map(x=>x.name),
    activeAllergies:user.allergies.map(x=>`${x.allergen}${x.severity && x.severity!=="unknown"?` (${x.severity})`:""}`),
    activeSpecialProfiles:user.specialHealthProfiles.map(x=>x.type),
    locationHint,
    usedFields:[] as string[],
  };
  if(context.ageBand) context.usedFields.push("yaş aralığı");
  if(context.activeConditions.length) context.usedFields.push("aktif sağlık durumları");
  if(context.activeMedications.length) context.usedFields.push("aktif ilaçlar");
  if(context.activeAllergies.length) context.usedFields.push("aktif alerjiler");
  if(context.activeSpecialProfiles.length) context.usedFields.push("özel sağlık profili");
  if(context.locationHint) context.usedFields.push("konum ipucu");
  return context;
}

export function personalizationNote(ctx: SafePersonalizationContext | null) {
  if (!ctx || !ctx.usedFields.length) return null;
  return `İzninizle kişiselleştirme için ${ctx.usedFields.join(", ")} dikkate alındı. Bu veriler yönlendirmeyi destekler; tanı üretmek için kullanılmaz.`;
}
