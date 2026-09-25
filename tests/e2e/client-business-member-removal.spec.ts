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

test.describe('client-business member removal and access revocation', () => {
  test('CLIENT_ADMIN can remove a member and the membership is deleted', async ({ page }) => {
    const ownerEmail = testEmail('remove-owner');
    const adminEmail = testEmail('remove-admin');
    const memberEmail = testEmail('remove-member');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Removal Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Removal Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Removal Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Removal Business',
        role: 'CLIENT_ADMIN',
      });
      const member = await createVerifiedUser({
        name: 'E2E Removed Member',
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

      await page.getByRole('button', { name: 'Remove E2E Removed Member' }).click();
      await expect(
        page.getByRole('heading', { name: 'Remove E2E Removed Member?' })
      ).toBeVisible();
      await page.getByRole('button', { name: 'Remove member' }).click();

      await expect(page.getByText('E2E Removed Member', { exact: true })).toHaveCount(0);

      const membership = await prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: business.id,
            userId: member.id,
          },
        },
      });
      expect(membership).toBeNull();
    } finally {
      await deleteUserByEmail(memberEmail);
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('removed member loses business access on the next request', async ({ browser }) => {
    const ownerEmail = testEmail('revoke-owner');
    const adminEmail = testEmail('revoke-admin');
    const memberEmail = testEmail('revoke-member');

    const adminContext = await browser.newContext();
    const memberContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Revocation Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Revocation Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Revocation Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Revocation Business',
        role: 'CLIENT_ADMIN',
      });
      const member = await createVerifiedUser({
        name: 'E2E Revoked Member',
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

      await signIn(memberPage, memberEmail, PASSWORD);
      await expect(
        memberPage
          .getByRole('main')
          .getByText('E2E Revocation Business', { exact: true }),
      ).toBeVisible();

      await signIn(adminPage, adminEmail, PASSWORD);
      await adminPage.goto(`/dashboard/businesses/${business.id}/members`);
      await adminPage.getByRole('button', { name: 'Remove E2E Revoked Member' }).click();
      await adminPage.getByRole('button', { name: 'Remove member' }).click();
      await expect(adminPage.getByText('E2E Revoked Member', { exact: true })).toHaveCount(0);

      await memberPage.reload();
      await expect(
        memberPage.getByRole('main').getByText('No client business access', { exact: true })
      ).toBeVisible();
      await expect(memberPage.getByText('E2E Revocation Business', { exact: true })).toHaveCount(0);
    } finally {
      await adminContext.close();
      await memberContext.close();
      await deleteUserByEmail(memberEmail);
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('removal from one business preserves membership in another business and falls back safely', async ({ browser }) => {
    const ownerEmail = testEmail('isolation-owner');
    const adminEmail = testEmail('isolation-admin');
    const memberEmail = testEmail('isolation-member');

    const adminContext = await browser.newContext();
    const memberContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Isolation Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Isolation Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Isolation Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const businessA = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Removed Business',
        role: 'CLIENT_ADMIN',
      });
      const businessB = await prisma.business.create({
        data: {
          organizationId: organization.id,
          name: 'E2E Preserved Business',
          slug: `e2e-preserved-${randomUUID()}`,
          code: `E2E-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });
      const member = await createVerifiedUser({
        name: 'E2E Multi Business Member',
        email: memberEmail,
        password: PASSWORD,
      });

      await prisma.businessMember.createMany({
        data: [
          { businessId: businessA.id, userId: member.id, role: 'RECEIVING' },
          { businessId: businessB.id, userId: member.id, role: 'SHIPPING' },
        ],
      });

      await signIn(memberPage, memberEmail, PASSWORD);
      await memberContext.addCookies([
        {
          name: 'nexus-active-business',
          value: businessA.id,
          url: 'http://localhost:3000',
        },
      ]);
      await memberPage.goto('/dashboard');
      await expect(
        memberPage
          .getByRole('main')
          .getByText('E2E Removed Business', { exact: true }),
      ).toBeVisible();

      await signIn(adminPage, adminEmail, PASSWORD);
      await adminPage.goto(`/dashboard/businesses/${businessA.id}/members`);
      await adminPage.getByRole('button', { name: 'Remove E2E Multi Business Member' }).click();
      await adminPage.getByRole('button', { name: 'Remove member' }).click();

      await memberPage.reload();
      await expect(
        memberPage.getByRole('heading', { name: 'Shipping workspace', exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        memberPage.getByRole('main').getByText('E2E Removed Business', { exact: true }),
      ).toHaveCount(0);

      const removedMembership = await prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: businessA.id,
            userId: member.id,
          },
        },
      });
      const preservedMembership = await prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: businessB.id,
            userId: member.id,
          },
        },
      });

      expect(removedMembership).toBeNull();
      expect(preservedMembership?.role).toBe('SHIPPING');
    } finally {
      await adminContext.close();
      await memberContext.close();
      await deleteUserByEmail(memberEmail);
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('CLIENT_ADMIN cannot remove their own administrative access', async ({ page }) => {
    const ownerEmail = testEmail('self-remove-owner');
    const adminEmail = testEmail('self-remove-admin');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Self Removal Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Self Removal Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const admin = await createVerifiedUser({
        name: 'E2E Protected Client Admin',
        email: adminEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: admin.id,
        organizationId: organization.id,
        businessName: 'E2E Self Removal Business',
        role: 'CLIENT_ADMIN',
      });

      await signIn(page, adminEmail, PASSWORD);
      await page.goto(`/dashboard/businesses/${business.id}/members`);

      await expect(page.getByText('Your role', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Remove E2E Protected Client Admin' })).toHaveCount(0);

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
