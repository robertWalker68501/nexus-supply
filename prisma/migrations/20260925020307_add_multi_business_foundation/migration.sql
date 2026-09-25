/*
  Warnings:

  - The values [MANAGER,OPERATOR,CSR] on the enum `OrganizationRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [USER,MANAGER,CUSTOMER,CSR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('MANAGER', 'RECEIVING', 'SHIPPING', 'CUSTOMER_SERVICE', 'VIEWER');

-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationRole_new" AS ENUM ('OWNER', 'ADMIN');
ALTER TABLE "public"."organization_member" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "organization_member" ALTER COLUMN "role" TYPE "OrganizationRole_new" USING ("role"::text::"OrganizationRole_new");
ALTER TYPE "OrganizationRole" RENAME TO "OrganizationRole_old";
ALTER TYPE "OrganizationRole_new" RENAME TO "OrganizationRole";
DROP TYPE "public"."OrganizationRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('OWNER', 'ADMIN');
ALTER TABLE "public"."user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "organization_member" ALTER COLUMN "role" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "business_member" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BusinessRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_member_userId_idx" ON "business_member"("userId");

-- CreateIndex
CREATE INDEX "business_member_businessId_role_idx" ON "business_member"("businessId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "business_member_businessId_userId_key" ON "business_member"("businessId", "userId");

-- AddForeignKey
ALTER TABLE "business_member" ADD CONSTRAINT "business_member_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_member" ADD CONSTRAINT "business_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
