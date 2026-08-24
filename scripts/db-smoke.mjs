import {PrismaClient} from '@prisma/client';
const prisma=new PrismaClient();
try{
  await prisma.$queryRaw`SELECT 1`;
  const [users,organizations]=await Promise.all([prisma.user.count(),prisma.organization.count()]);
  if(users<1)throw new Error('seed smoke failed: no users');
  if(organizations<1)throw new Error('seed smoke failed: no organizations');
  const marker=`smoke-${Date.now()}@example.invalid`;
  const row=await prisma.user.create({data:{email:marker,name:'CI Smoke',role:'PATIENT'}});
  await prisma.user.delete({where:{id:row.id}});
  console.log(`db smoke OK (users=${users}, organizations=${organizations})`);
}finally{await prisma.$disconnect()}
