-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "vendor" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_businessId_status_idx" ON "vendor"("businessId", "status");

-- CreateIndex
CREATE INDEX "vendor_businessId_name_idx" ON "vendor"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_businessId_code_key" ON "vendor"("businessId", "code");

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
