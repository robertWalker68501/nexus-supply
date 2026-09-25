import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';

import { PrismaClient } from '../../../app/generated/prisma/client';
import type { BusinessRole, OrganizationRole, Role } from '../../../app/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for E2E tests.');

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export async function createVerifiedUser(options: {
  name: string;
  email: string;
  password: string;
  role?: Role | null;
}) {
  const userId = randomUUID();
  const password = await hashPassword(options.password);

  return prisma.user.create({
    data: {
      id: userId,
      name: options.name,
      email: options.email,
      emailVerified: true,
      role: options.role ?? null,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: 'credential',
          password,
        },
      },
    },
  });
}

export async function createOrganizationMembership(options: {
  userId: string;
  organizationName: string;
  role: OrganizationRole;
}) {
  const slug = `e2e-org-${randomUUID()}`;
  return prisma.organization.create({
    data: {
      name: options.organizationName,
      slug,
      members: {
        create: {
          userId: options.userId,
          role: options.role,
        },
      },
    },
  });
}

export async function createBusinessMembership(options: {
  userId: string;
  organizationId: string;
  businessName: string;
  role: BusinessRole;
}) {
  const token = randomUUID();
  return prisma.business.create({
    data: {
      organizationId: options.organizationId,
      name: options.businessName,
      slug: `e2e-business-${token}`,
      code: `E2E-${token.slice(0, 8).toUpperCase()}`,
      members: {
        create: {
          userId: options.userId,
          role: options.role,
        },
      },
    },
  });
}

export async function deleteUserByEmail(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}

export async function getBusinessMembershipForUser(userId: string, businessId: string) {
  return prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId,
      },
    },
    include: {
      business: true,
    },
  });
}

export async function createBusiness(options: {
  organizationId: string;
  businessName: string;
}) {
  const token = randomUUID();

  return prisma.business.create({
    data: {
      organizationId: options.organizationId,
      name: options.businessName,
      slug: `e2e-business-${token}`,
      code: `E2E-${token.slice(0, 8).toUpperCase()}`,
    },
  });
}

export async function addBusinessMembership(options: {
  userId: string;
  businessId: string;
  role: BusinessRole;
}) {
  return prisma.businessMember.create({
    data: {
      userId: options.userId,
      businessId: options.businessId,
      role: options.role,
    },
  });
}

