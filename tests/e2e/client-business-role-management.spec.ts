import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

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

test.describe('client-business role management', () => {
  test('CLIENT_ADMIN can change a member from RECEIVING to SHIPPING and the new role persists', async ({ page }) => {
    const ownerEmail = testEmail('role-owner');
    const adminEmail = testEmail('role-admin');
    const memberEmail = testEmail('role-member');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Role Setup Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Role Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Role Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Role Business',
        role: 'CLIENT_ADMIN',
      });
      const member = await createVerifiedUser({
        name: 'E2E Operations Member',
        email: memberEmail,
        password: PASSWORD,
      });

      await prisma.businessMember.create({
        data: {
          businessId: business.id,
          userId: member.id,
          role: 'RECEIVING',
        },
      });

      await signIn(page, adminEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${business.id}/members`);

      await page.getByLabel('Role for E2E Operations Member').selectOption('SHIPPING');
      await page.getByRole('button', { name: 'Save role' }).click();

      await expect(
        page.getByText("E2E Operations Member's role was updated.", { exact: true })
      ).toBeVisible();

      const membership = await prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: business.id,
            userId: member.id,
          },
        },
      });
      expect(membership?.role).toBe('SHIPPING');

      await page.reload();
      await expect(page.getByLabel('Role for E2E Operations Member')).toHaveValue('SHIPPING');
    } finally {
      await deleteUserByEmail(memberEmail);
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('role change is reflected when the member signs in and RECEIVING does not remain active', async ({ page }) => {
    const ownerEmail = testEmail('effective-owner');
    const adminEmail = testEmail('effective-admin');
    const memberEmail = testEmail('effective-member');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Effective Role Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Effective Role Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Effective Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Effective Role Business',
        role: 'CLIENT_ADMIN',
      });
      const member = await createVerifiedUser({
        name: 'E2E Effective Member',
        email: memberEmail,
        password: PASSWORD,
      });
      const membership = await prisma.businessMember.create({
        data: {
          businessId: business.id,
          userId: member.id,
          role: 'RECEIVING',
        },
      });

      await signIn(page, adminEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${business.id}/members`);
      await page.getByLabel('Role for E2E Effective Member').selectOption('SHIPPING');
      await page.getByRole('button', { name: 'Save role' }).click();
      await expect(page.getByText("E2E Effective Member's role was updated.")).toBeVisible();

      await page.context().clearCookies();
      await signIn(page, memberEmail, PASSWORD);

      await expect(
        page.locator('[data-slot="badge"]', { hasText: /^Shipping$/ })
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="badge"]', { hasText: /^Receiving$/ })
      ).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: 'Shipping workspace', exact: true })
      ).toBeVisible();

      const persisted = await prisma.businessMember.findUnique({
        where: { id: membership.id },
      });
      expect(persisted?.role).toBe('SHIPPING');
    } finally {
      await deleteUserByEmail(memberEmail);
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('CLIENT_ADMIN cannot change their own administrative role', async ({ page }) => {
    const ownerEmail = testEmail('self-owner');
    const adminEmail = testEmail('self-admin');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Self Role Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Self Role Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Self Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Self Role Business',
        role: 'CLIENT_ADMIN',
      });

      await signIn(page, adminEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${business.id}/members`);

      await expect(page.getByText('Your role', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Role for E2E Self Client Admin')).toHaveCount(0);

      const membership = await prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: business.id,
            userId: admin.id,
          },
        },
      });
      expect(membership?.role).toBe('CLIENT_ADMIN');
    } finally {
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
