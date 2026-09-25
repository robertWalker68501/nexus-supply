import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export type PlatformRole = 'OWNER' | 'ADMIN';
export type OrganizationRole = 'OWNER' | 'ADMIN';
export type BusinessRole =
  | 'CLIENT_ADMIN'
  | 'MANAGER'
  | 'RECEIVING'
  | 'SHIPPING'
  | 'CUSTOMER_SERVICE'
  | 'VIEWER';

export function canCreateOrganization(role: string | null | undefined) {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canManageBusinesses(role: string | null | undefined) {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canManageBusinessMembers(role: string | null | undefined) {
  return role === 'CLIENT_ADMIN';
}

export async function requireOrganizationMembership() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });

  return { session, membership };
}

export async function getBusinessMembership(userId: string, businessId: string) {
  return prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    include: { business: true },
  });
}
