-- CreateEnum
CREATE TYPE "BusinessInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "business_invitation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "BusinessRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "BusinessInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_invitation_tokenHash_key" ON "business_invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "business_invitation_businessId_status_idx" ON "business_invitation"("businessId", "status");

-- CreateIndex
CREATE INDEX "business_invitation_email_status_idx" ON "business_invitation"("email", "status");

-- AddForeignKey
ALTER TABLE "business_invitation" ADD CONSTRAINT "business_invitation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invitation" ADD CONSTRAINT "business_invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
