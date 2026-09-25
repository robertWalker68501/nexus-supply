'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canManageBusinesses } from '@/lib/businesses/access';
import prisma from '@/lib/prisma';
import { createBusinessInvitation } from '@/lib/businesses/invitations';
import { assignInitialClientAdminSchema } from '@/lib/schemas/ClientAdminSchema';

export type ClientAdminActionState = {
  error?: string;
  success?: string;
};

export async function assignInitialClientAdmin(
  businessId: string,
  _state: ClientAdminActionState,
  formData: FormData
): Promise<ClientAdminActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  const parsed = assignInitialClientAdminSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid email address.' };
  }

  const organizationMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!organizationMembership || !canManageBusinesses(organizationMembership.role)) {
    return { error: 'You do not have permission to bootstrap client administrators.' };
  }

  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      organizationId: organizationMembership.organizationId,
    },
    select: { id: true, name: true },
  });

  if (!business) return { error: 'Client business not found.' };

  const existingClientAdmin = await prisma.businessMember.findFirst({
    where: { businessId, role: 'CLIENT_ADMIN' },
  });

  if (existingClientAdmin) {
    return {
      error:
        'This client business already has a client administrator. Ongoing user administration belongs to the client.',
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true },
  });

  if (!user) {
    await createBusinessInvitation({
      businessId,
      email: parsed.data.email,
      role: 'CLIENT_ADMIN',
      invitedById: session.user.id,
    });
    revalidatePath('/dashboard/businesses');
    return {
      success: `Invitation sent to ${parsed.data.email} to become the client administrator for ${business.name}.`,
    };
  }

  if (user.role) {
    return {
      error:
        'A platform owner or administrator cannot also be the client administrator.',
    };
  }

  const existingMembership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: user.id,
      },
    },
  });

  if (existingMembership) {
    await prisma.businessMember.update({
      where: { id: existingMembership.id },
      data: { role: 'CLIENT_ADMIN' },
    });
  } else {
    await prisma.businessMember.create({
      data: {
        businessId,
        userId: user.id,
        role: 'CLIENT_ADMIN',
      },
    });
  }

  revalidatePath('/dashboard/businesses');
  return { success: `${parsed.data.email} is now the client administrator for ${business.name}.` };
}
