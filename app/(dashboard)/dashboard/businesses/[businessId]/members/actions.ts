'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { canManageBusinessMembers } from '@/lib/businesses/access';
import prisma from '@/lib/prisma';
import { createBusinessInvitation } from '@/lib/businesses/invitations';
import {
  addBusinessMemberSchema,
  updateBusinessMemberRoleSchema,
} from '@/lib/schemas/BusinessMemberSchema';

export type BusinessMemberActionState = {
  error?: string;
  success?: string;
};

export async function addBusinessMember(
  businessId: string,
  _state: BusinessMemberActionState,
  formData: FormData
): Promise<BusinessMemberActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  const parsed = addBusinessMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid member details' };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, organizationId: true, name: true },
  });

  if (!business) return { error: 'Client business not found.' };

  if (session.user.role) {
    return { error: 'Client-business membership is managed by the client administrator.' };
  }

  const administratorMembership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
  });

  if (!administratorMembership || !canManageBusinessMembers(administratorMembership.role)) {
    return { error: 'You do not have permission to manage members for this business.' };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true },
  });

  if (!user) {
    await createBusinessInvitation({
      businessId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: session.user.id,
    });
    revalidatePath(`/dashboard/businesses/${businessId}/members`);
    return { success: `Invitation sent to ${parsed.data.email}.` };
  }

  if (user.role) {
    return { error: 'Platform owners and administrators cannot be assigned as client-business members.' };
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
    return { error: 'That user is already a member of this client business.' };
  }

  await prisma.businessMember.create({
    data: {
      businessId,
      userId: user.id,
      role: parsed.data.role,
    },
  });

  revalidatePath(`/dashboard/businesses/${businessId}/members`);
  return { success: `Member added to ${business.name}.` };
}


export async function updateBusinessMemberRole(
  businessId: string,
  membershipId: string,
  _state: BusinessMemberActionState,
  formData: FormData
): Promise<BusinessMemberActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  if (session.user.role) {
    return { error: 'Client-business roles are managed by the client administrator.' };
  }

  const parsed = updateBusinessMemberRoleSchema.safeParse({
    role: formData.get('role'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid business role.' };
  }

  const administratorMembership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
  });

  if (
    !administratorMembership ||
    !canManageBusinessMembers(administratorMembership.role)
  ) {
    return { error: 'You do not have permission to manage roles for this business.' };
  }

  const targetMembership = await prisma.businessMember.findFirst({
    where: {
      id: membershipId,
      businessId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!targetMembership) {
    return { error: 'Business member not found.' };
  }

  if (targetMembership.userId === session.user.id) {
    return {
      error:
        'You cannot change your own client administrator role. Another client administrator must change it.',
    };
  }

  if (targetMembership.role === parsed.data.role) {
    return { success: `${targetMembership.user.name} already has that role.` };
  }

  await prisma.businessMember.update({
    where: { id: targetMembership.id },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/dashboard/businesses/${businessId}/members`);
  revalidatePath('/dashboard', 'layout');

  return { success: `${targetMembership.user.name}'s role was updated.` };
}


export async function removeBusinessMember(
  businessId: string,
  membershipId: string,
  _state: BusinessMemberActionState,
  _formData: FormData
): Promise<BusinessMemberActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  if (session.user.role) {
    return { error: 'Client-business membership is managed by the client administrator.' };
  }

  const administratorMembership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
  });

  if (
    !administratorMembership ||
    !canManageBusinessMembers(administratorMembership.role)
  ) {
    return { error: 'You do not have permission to remove members from this business.' };
  }

  const targetMembership = await prisma.businessMember.findFirst({
    where: {
      id: membershipId,
      businessId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!targetMembership) {
    return { error: 'Business member not found.' };
  }

  if (targetMembership.userId === session.user.id) {
    return {
      error:
        'You cannot remove your own client administrator access. Another client administrator must manage your access.',
    };
  }

  await prisma.businessMember.delete({
    where: { id: targetMembership.id },
  });

  revalidatePath(`/dashboard/businesses/${businessId}/members`);
  revalidatePath('/dashboard', 'layout');

  return { success: `${targetMembership.user.name} was removed from this client business.` };
}
