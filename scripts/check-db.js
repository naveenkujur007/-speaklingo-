const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const tables = ['session','message','mistake','lesson','learnedItem','review','progress','streak','achievement','pronunciationAttempt'];
  for (const t of tables) {
    try {
      const count = await prisma[t].count();
      console.log(`${t}: ${count} rows`);
    } catch(e) {
      console.log(`${t}: ERROR - ${e.message.substring(0,80)}`);
    }
  }
  await prisma.$disconnect();
})();
