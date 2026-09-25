import { createHash, randomBytes } from 'node:crypto';

import prisma from '@/lib/prisma';
import { sendBusinessInvitationEmail } from '@/lib/send-business-invitation-email';

import type { BusinessRole } from './access';

const INVITATION_LIFETIME_DAYS = 7;

export function hashBusinessInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createBusinessInvitation({
  businessId,
  email,
  role,
  invitedById,
}: {
  businessId: string;
  email: string;
  role: BusinessRole;
  invitedById: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashBusinessInvitationToken(token);
  const expiresAt = new Date(
    Date.now() + INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000
  );

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { name: true },
  });

  await prisma.businessInvitation.updateMany({
    where: {
      businessId,
      email: normalizedEmail,
      status: 'PENDING',
    },
    data: { status: 'REVOKED' },
  });

  const invitation = await prisma.businessInvitation.create({
    data: {
      businessId,
      email: normalizedEmail,
      role,
      tokenHash,
      expiresAt,
      invitedById,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const invitationUrl = `${baseUrl.replace(/\/$/, '')}/invite/${token}`;

  await sendBusinessInvitationEmail({
    to: normalizedEmail,
    businessName: business.name,
    role,
    invitationUrl,
    expiresAt,
  });

  return invitation;
}
