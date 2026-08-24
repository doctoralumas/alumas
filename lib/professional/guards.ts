import { prisma } from "@/lib/prisma";
import { agencyCanOperate, canOperate } from "./account-config";

export async function getProfessionalAccountForUser(userId:string, accountId:string){
  return prisma.professionalAccount.findFirst({
    where:{id:accountId, OR:[{ownerUserId:userId},{memberships:{some:{userId,isActive:true}}}]},
    include:{documents:true,healthTourism:true,memberships:true}
  });
}

export function assertProfessionalOperation(account:any){
  if(!account || !canOperate(account.verificationStatus)) throw new Error("PROFESSIONAL_ACCOUNT_NOT_APPROVED");
  if(account.accountType==="HEALTH_TOURISM_AGENCY" && !agencyCanOperate(account)){
    throw new Error("HEALTH_TOURISM_AUTHORIZATION_REQUIRED");
  }
}
