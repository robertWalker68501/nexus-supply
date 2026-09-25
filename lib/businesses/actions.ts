'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { ACTIVE_BUSINESS_COOKIE } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

export async function setActiveBusiness(businessId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role) {
    throw new Error('You do not have access to a client-business context.');
  }

  const membership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
    include: { business: true },
  });

  if (!membership || membership.business.status !== 'ACTIVE') {
    throw new Error('You do not have access to that client business.');
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  revalidatePath('/dashboard', 'layout');
}
