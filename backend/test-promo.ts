import prisma from './src/lib/prisma.js';
import fs from 'fs';
async function run() {
  const p = await prisma.promotion.findMany({ include: { event: true } });
  fs.writeFileSync('promo-output.json', JSON.stringify(p, null, 2));
}
run().catch(console.error).finally(()=>prisma.$disconnect());
