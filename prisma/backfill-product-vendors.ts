import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../app/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const products = await prisma.product.findMany({ where: { vendorId: { not: null } }, select: { id: true, vendorId: true, vendorSku: true } });
  for (const product of products) {
    if (!product.vendorId) continue;
    await prisma.productVendor.upsert({
      where: { productId_vendorId: { productId: product.id, vendorId: product.vendorId } },
      create: { productId: product.id, vendorId: product.vendorId, vendorSku: product.vendorSku, preferred: true },
      update: { vendorSku: product.vendorSku, preferred: true },
    });
  }
  console.log(`Backfilled vendor sources for ${products.length} product(s).`);
}

main().finally(() => prisma.$disconnect());
