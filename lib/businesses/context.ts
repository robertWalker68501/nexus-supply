import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const ACTIVE_BUSINESS_COOKIE = 'nexus-active-business';

export async function getBusinessContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  if (session.user.role) {
    return {
      session,
      activeMembership: null,
      memberships: [],
    };
  }

  const memberships = await prisma.businessMember.findMany({
    where: {
      userId: session.user.id,
      business: { status: 'ACTIVE' },
    },
    include: { business: true },
    orderBy: [{ createdAt: 'asc' }, { business: { name: 'asc' } }],
  });

  const cookieStore = await cookies();
  const requestedBusinessId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const activeMembership =
    memberships.find((membership) => membership.businessId === requestedBusinessId) ??
    memberships[0] ??
    null;

  return {
    session,
    activeMembership,
    memberships,
  };
}
