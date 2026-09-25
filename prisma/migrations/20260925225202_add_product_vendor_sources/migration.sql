-- CreateTable
CREATE TABLE "product_vendor" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorSku" TEXT,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_vendor_vendorId_idx" ON "product_vendor"("vendorId");

-- CreateIndex
CREATE INDEX "product_vendor_productId_preferred_idx" ON "product_vendor"("productId", "preferred");

-- CreateIndex
CREATE UNIQUE INDEX "product_vendor_productId_vendorId_key" ON "product_vendor"("productId", "vendorId");

-- AddForeignKey
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
