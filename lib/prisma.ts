import { Prisma, PrismaClient } from "@prisma/client";

type AppPrisma = PrismaClient & {
  verificationDocument: Prisma.VerificationDocumentDelegate;
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: AppPrisma | undefined;
}

export const prisma: AppPrisma = (global.prisma ?? new PrismaClient()) as AppPrisma;
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
