'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { hashBusinessInvitationToken } from '@/lib/businesses/invitations';
import prisma from '@/lib/prisma';

export async function acceptBusinessInvitation(token: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/sign-in?callbackURL=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const tokenHash = hashBusinessInvitationToken(token);
  const invitation = await prisma.businessInvitation.findUnique({
    where: { tokenHash },
  });

  if (
    !invitation ||
    invitation.status !== 'PENDING' ||
    invitation.expiresAt <= new Date()
  ) {
    redirect('/dashboard?invitation=invalid');
  }

  if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    redirect(`/invite/${token}?error=email`);
  }

  if (session.user.role) {
    redirect(`/invite/${token}?error=platform`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: invitation.businessId,
          userId: session.user.id,
        },
      },
      create: {
        businessId: invitation.businessId,
        userId: session.user.id,
        role: invitation.role,
      },
      update: {
        role: invitation.role,
      },
    });

    await tx.businessInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });
  });

  redirect('/dashboard');
}
