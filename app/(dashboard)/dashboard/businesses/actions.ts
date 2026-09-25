'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import slugify from 'slugify';

import { auth } from '@/lib/auth';
import { canCreateOrganization, canManageBusinesses } from '@/lib/businesses/access';
import prisma from '@/lib/prisma';
import { createBusinessInvitation } from '@/lib/businesses/invitations';
import {
  createBusinessSchema,
  createOrganizationSchema,
} from '@/lib/schemas/BusinessSchema';

export type BusinessActionState = {
  error?: string;
};

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');
  return session;
}

async function uniqueOrganizationSlug(name: string) {
  const base = slugify(name, { lower: true, strict: true }) || 'workspace';
  let slug = base;
  let suffix = 2;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}

async function uniqueBusinessSlug(organizationId: string, name: string) {
  const base = slugify(name, { lower: true, strict: true }) || 'business';
  let slug = base;
  let suffix = 2;

  while (
    await prisma.business.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    })
  ) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}


async function uniqueBusinessCode(organizationId: string, name: string) {
  const base =
    slugify(name, { lower: false, strict: true })
      .toUpperCase()
      .slice(0, 24) || 'BUSINESS';
  let code = base;
  let suffix = 2;

  while (
    await prisma.business.findUnique({
      where: { organizationId_code: { organizationId, code } },
    })
  ) {
    const suffixText = `-${suffix++}`;
    code = `${base.slice(0, 24 - suffixText.length)}${suffixText}`;
  }

  return code;
}

export async function createOrganization(
  _state: BusinessActionState,
  formData: FormData
): Promise<BusinessActionState> {
  const session = await getSession();

  if (!canCreateOrganization(session.user.role)) {
    return { error: 'Only a NexusSupply owner or administrator can create the operating workspace.' };
  }

  const parsed = createOrganizationSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid workspace name' };
  }

  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
  });

  if (existingMembership) return { error: 'You already belong to a workspace.' };

  const slug = await uniqueOrganizationSlug(parsed.data.name);

  await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: 'OWNER',
        },
      },
    },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard/businesses');
}

export async function createBusiness(
  _state: BusinessActionState,
  formData: FormData
): Promise<BusinessActionState> {
  const session = await getSession();
  const parsed = createBusinessSchema.safeParse({
    name: formData.get('name'),
    clientAdminEmail: formData.get('clientAdminEmail'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid business details' };
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership || !canManageBusinesses(membership.role)) {
    return { error: 'You do not have permission to add businesses.' };
  }

  const [slug, code] = await Promise.all([
    uniqueBusinessSlug(membership.organizationId, parsed.data.name),
    uniqueBusinessCode(membership.organizationId, parsed.data.name),
  ]);

  let clientAdminUserId: string | undefined;

  if (parsed.data.clientAdminEmail) {
    const clientAdmin = await prisma.user.findUnique({
      where: { email: parsed.data.clientAdminEmail },
      select: { id: true, role: true },
    });

    if (!clientAdmin) {
      clientAdminUserId = undefined;
    } else if (clientAdmin.role) {
      return {
        error:
          'A platform owner or administrator cannot also be the client administrator.',
      };
    } else {
      clientAdminUserId = clientAdmin.id;
    }
  }

  const business = await prisma.business.create({
    data: {
      organizationId: membership.organizationId,
      name: parsed.data.name,
      slug,
      code,
      members: clientAdminUserId
        ? {
            create: {
              userId: clientAdminUserId,
              role: 'CLIENT_ADMIN',
            },
          }
        : undefined,
    },
  });

  if (parsed.data.clientAdminEmail && !clientAdminUserId) {
    await createBusinessInvitation({
      businessId: business.id,
      email: parsed.data.clientAdminEmail,
      role: 'CLIENT_ADMIN',
      invitedById: session.user.id,
    });
  }

  revalidatePath('/dashboard/businesses');
  redirect('/dashboard/businesses');
}
