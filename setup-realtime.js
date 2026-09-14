const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Message";`);
    console.log("Added Message to realtime publication");
  } catch (e) { console.log("Pub error:", e.message); }
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;`);
    console.log("Enabled RLS on Message table");
  } catch (e) { console.log("RLS error:", e.message); }

  try {
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "User Message Access" ON "Message";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "User Message Access" ON "Message" 
      FOR SELECT USING (
        "senderId" = (current_setting('request.jwt.claims', true)::json->>'custom_id') OR 
        "recipientId" = (current_setting('request.jwt.claims', true)::json->>'custom_id')
      );
    `);
    console.log("Created Select Policy for Messages");
  } catch (e) { console.log("Policy error:", e.message); }
}
main().finally(() => prisma.$disconnect());
