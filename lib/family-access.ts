import {prisma} from './prisma';
export async function familyProfilePermission(userId:string,profileId:string,permission='VIEW'){
  const profile=await prisma.specialHealthProfile.findUnique({where:{id:profileId}});
  if(!profile||!profile.isActive)return null;
  if(profile.userId===userId)return {profile,owner:true,permissions:['*']};
  const access=await prisma.familyProfileAccess.findUnique({where:{specialProfileId_userId:{specialProfileId:profileId,userId}}});
  if(!access||!access.isActive||!access.permissions.includes('VIEW')||(permission!=='VIEW'&&!access.permissions.includes(permission)))return null;
  return {profile,owner:false,permissions:access.permissions,access};
}
