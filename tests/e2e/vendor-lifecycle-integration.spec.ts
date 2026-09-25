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

function testEmail() {
  return `e2e-vendor-lifecycle-${randomUUID()}@example.com`;
}

async function createFixture() {
  const ownerEmail = testEmail();
  const managerEmail = testEmail();

  const owner = await createVerifiedUser({
    name: 'E2E Vendor Lifecycle Owner',
    email: ownerEmail,
    password: PASSWORD,
    role: 'OWNER',
  });
  const organization = await createOrganizationMembership({
    userId: owner.id,
    organizationName: `E2E Vendor Lifecycle Org ${randomUUID().slice(0, 8)}`,
    role: 'OWNER',
  });
  const manager = await createVerifiedUser({
    name: 'E2E Vendor Lifecycle Manager',
    email: managerEmail,
    password: PASSWORD,
  });
  const business = await createBusinessMembership({
    userId: manager.id,
    organizationId: organization.id,
    businessName: 'E2E Vendor Lifecycle Business',
    role: 'MANAGER',
  });

  return { ownerEmail, managerEmail, organization, business };
}

async function cleanupFixture(fixture: Awaited<ReturnType<typeof createFixture>>) {
  await prisma.organization.deleteMany({ where: { id: fixture.organization.id } });
  await deleteUserByEmail(fixture.managerEmail);
  await deleteUserByEmail(fixture.ownerEmail);
}

test.describe('vendor lifecycle and integration', () => {
  test('deactivated vendor remains persisted and inactive across reload and a new session', async ({ page, context }) => {
    const fixture = await createFixture();

    try {
      const vendor = await prisma.vendor.create({
        data: {
          businessId: fixture.business.id,
          name: 'Persistent Lifecycle Vendor',
          code: 'PERSISTENT-LIFECYCLE',
        },
      });

      await signIn(page, fixture.managerEmail, PASSWORD);
      await page.goto(`/dashboard/vendors/${vendor.id}`);
      await page.getByRole('button', { name: 'Deactivate vendor' }).click();

      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
      await expect
        .poll(async () => (await prisma.vendor.findUnique({ where: { id: vendor.id } }))?.status)
        .toBe('INACTIVE');

      await page.reload();
      await expect(page.getByRole('main').getByText('Persistent Lifecycle Vendor', { exact: true })).toBeVisible();
      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reactivate vendor' })).toBeVisible();

      await context.clearCookies();
      await signIn(page, fixture.managerEmail, PASSWORD);
      await page.goto('/dashboard/vendors');

      await expect(page.getByRole('main').getByText('Persistent Lifecycle Vendor', { exact: true })).toBeVisible();
      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('vendor list keeps active vendors ahead of inactive vendors and sorts names within each status', async ({ page }) => {
    const fixture = await createFixture();

    try {
      await prisma.vendor.createMany({
        data: [
          { businessId: fixture.business.id, name: 'Zulu Active Vendor', code: 'ZULU-ACTIVE', status: 'ACTIVE' },
          { businessId: fixture.business.id, name: 'Alpha Inactive Vendor', code: 'ALPHA-INACTIVE', status: 'INACTIVE' },
          { businessId: fixture.business.id, name: 'Alpha Active Vendor', code: 'ALPHA-ACTIVE', status: 'ACTIVE' },
          { businessId: fixture.business.id, name: 'Zulu Inactive Vendor', code: 'ZULU-INACTIVE', status: 'INACTIVE' },
        ],
      });

      await signIn(page, fixture.managerEmail, PASSWORD);
      await page.goto('/dashboard/vendors');

      const cards = page.getByRole('main').locator('[data-slot="card"]');
      await expect(cards).toHaveCount(4);

      await expect(cards.nth(0)).toContainText('Alpha Active Vendor');
      await expect(cards.nth(0)).toContainText('Active');
      await expect(cards.nth(1)).toContainText('Zulu Active Vendor');
      await expect(cards.nth(1)).toContainText('Active');
      await expect(cards.nth(2)).toContainText('Alpha Inactive Vendor');
      await expect(cards.nth(2)).toContainText('Inactive');
      await expect(cards.nth(3)).toContainText('Zulu Inactive Vendor');
      await expect(cards.nth(3)).toContainText('Inactive');
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('vendor sidebar navigation integrates list and create routes for a manager', async ({ page }) => {
    const fixture = await createFixture();

    try {
      await signIn(page, fixture.managerEmail, PASSWORD);

      const viewVendors = page.getByRole('link', { name: 'View vendors', exact: true });
      const addVendor = page.getByRole('link', { name: 'Add vendor', exact: true });
      await expect(viewVendors).toBeVisible();
      await expect(addVendor).toBeVisible();

      await viewVendors.click();
      await expect(page).toHaveURL(/\/dashboard\/vendors$/);
      await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();

      await addVendor.click();
      await expect(page).toHaveURL(/\/dashboard\/vendors\/new$/);
      await expect(page.getByLabel('Vendor name')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add vendor', exact: true })).toBeVisible();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('deleting a client business cascades its vendor records without affecting another business', async () => {
    const fixture = await createFixture();

    try {
      const otherBusiness = await prisma.business.create({
        data: {
          organizationId: fixture.organization.id,
          name: 'E2E Surviving Business',
          slug: `e2e-surviving-${randomUUID()}`,
          code: `SURV-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });
      const deletedVendor = await prisma.vendor.create({
        data: {
          businessId: fixture.business.id,
          name: 'Vendor Removed With Business',
          code: 'REMOVED-WITH-BUSINESS',
        },
      });
      const survivingVendor = await prisma.vendor.create({
        data: {
          businessId: otherBusiness.id,
          name: 'Vendor In Other Business',
          code: 'SURVIVING-VENDOR',
        },
      });

      await prisma.business.delete({ where: { id: fixture.business.id } });

      await expect.poll(async () => prisma.vendor.findUnique({ where: { id: deletedVendor.id } })).toBeNull();
      await expect
        .poll(async () => (await prisma.vendor.findUnique({ where: { id: survivingVendor.id } }))?.id)
        .toBe(survivingVendor.id);
    } finally {
      await cleanupFixture(fixture);
    }
  });
});
