-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "vendorId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'Each',
    "vendorSku" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_businessId_status_idx" ON "product"("businessId", "status");

-- CreateIndex
CREATE INDEX "product_businessId_name_idx" ON "product"("businessId", "name");

-- CreateIndex
CREATE INDEX "product_vendorId_idx" ON "product"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "product_businessId_sku_key" ON "product"("businessId", "sku");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
