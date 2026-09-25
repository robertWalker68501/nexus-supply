import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  createBusinessMembership,
  createOrganizationMembership,
  createVerifiedUser,
  deleteUserByEmail,
  prisma,
} from './helpers/db';

const PASSWORD = 'NexusSupply-E2E-Password-42!';

function testEmail(label: string) {
  return `e2e-${label}-${randomUUID()}@example.com`;
}

test.describe('client-business user management authorization and tenant isolation', () => {
  test('non-administrative client roles cannot open member management', async ({
    page,
  }) => {
    const ownerEmail = testEmail('auth-owner');
    const memberEmail = testEmail('auth-member');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Authorization Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Authorization Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const member = await createVerifiedUser({
        name: 'E2E Authorization Manager',
        email: memberEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: member.id,
        organizationId: organization.id,
        businessName: 'E2E Authorization Business',
        role: 'MANAGER',
      });

      await signIn(page, memberEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${business.id}/members`);

      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /members$/ })).toHaveCount(
        0
      );
    } finally {
      await deleteUserByEmail(memberEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('CLIENT_ADMIN cannot manage members of a different client business', async ({
    page,
  }) => {
    const ownerEmail = testEmail('cross-owner');
    const adminEmail = testEmail('cross-admin');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Cross Tenant Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Cross Tenant Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Business A Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const businessA = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Business A',
        role: 'CLIENT_ADMIN',
      });
      const businessB = await prisma.business.create({
        data: {
          organizationId: organization.id,
          name: 'E2E Business B',
          slug: `e2e-business-b-${randomUUID()}`,
          code: `E2E-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });

      await signIn(page, adminEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${businessA.id}/members`);
      await expect(
        page.getByRole('heading', { name: 'E2E Business A members' })
      ).toBeVisible();

      await page.goto(`/dashboard/businesses/${businessB.id}/members`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(
        page.getByText('E2E Business B', { exact: true })
      ).toHaveCount(0);
    } finally {
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('CLIENT_ADMIN authority is scoped independently for each business', async ({
    page,
  }) => {
    const ownerEmail = testEmail('scope-owner');
    const adminEmail = testEmail('scope-admin');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Scoped Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Scoped Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Scoped Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const adminBusiness = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Admin Business',
        role: 'CLIENT_ADMIN',
      });
      const managerBusiness = await prisma.business.create({
        data: {
          organizationId: organization.id,
          name: 'E2E Manager Business',
          slug: `e2e-manager-business-${randomUUID()}`,
          code: `E2E-${randomUUID().slice(0, 8).toUpperCase()}`,
          members: {
            create: { userId: admin.id, role: 'MANAGER' },
          },
        },
      });

      await signIn(page, adminEmail, PASSWORD);

      await page.goto(`/dashboard/businesses/${adminBusiness.id}/members`);
      await expect(
        page.getByRole('heading', { name: 'E2E Admin Business members' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Add member', exact: true })
      ).toBeVisible();

      await page.goto(`/dashboard/businesses/${managerBusiness.id}/members`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Add member' })
      ).toHaveCount(0);
    } finally {
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('platform OWNER does not gain client member-management access', async ({
    page,
  }) => {
    const ownerEmail = testEmail('platform-owner');
    const adminEmail = testEmail('platform-client-admin');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Platform Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Platform Boundary Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Boundary Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Platform Boundary Business',
        role: 'CLIENT_ADMIN',
      });

      await signIn(page, ownerEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${business.id}/members`);

      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Add member' })
      ).toHaveCount(0);
    } finally {
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
