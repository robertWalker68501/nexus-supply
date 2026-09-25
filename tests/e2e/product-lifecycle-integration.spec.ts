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
  return `e2e-product-lifecycle-${randomUUID()}@example.com`;
}

async function createFixture() {
  const ownerEmail = testEmail();
  const managerEmail = testEmail();

  const owner = await createVerifiedUser({
    name: 'E2E Product Lifecycle Owner',
    email: ownerEmail,
    password: PASSWORD,
    role: 'OWNER',
  });
  const organization = await createOrganizationMembership({
    userId: owner.id,
    organizationName: `E2E Product Lifecycle Org ${randomUUID().slice(0, 8)}`,
    role: 'OWNER',
  });
  const manager = await createVerifiedUser({
    name: 'E2E Product Lifecycle Manager',
    email: managerEmail,
    password: PASSWORD,
  });
  const business = await createBusinessMembership({
    userId: manager.id,
    organizationId: organization.id,
    businessName: 'E2E Product Lifecycle Business',
    role: 'MANAGER',
  });

  return { ownerEmail, managerEmail, organization, business };
}

async function cleanupFixture(fixture: Awaited<ReturnType<typeof createFixture>>) {
  await prisma.organization.deleteMany({ where: { id: fixture.organization.id } });
  await deleteUserByEmail(fixture.managerEmail);
  await deleteUserByEmail(fixture.ownerEmail);
}

test.describe('product lifecycle and integration', () => {
  test('deactivated product remains inactive across reload and a fresh authenticated session', async ({ page, context }) => {
    const fixture = await createFixture();

    try {
      const product = await prisma.product.create({
        data: {
          businessId: fixture.business.id,
          name: 'Persistent Lifecycle Product',
          sku: 'PERSISTENT-PRODUCT',
        },
      });

      await signIn(page, fixture.managerEmail, PASSWORD);
      await page.goto(`/dashboard/products/${product.id}`);
      await page.getByRole('button', { name: 'Deactivate product' }).click();

      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
      await expect
        .poll(async () => (await prisma.product.findUnique({ where: { id: product.id } }))?.status)
        .toBe('INACTIVE');

      await page.reload();
      await expect(page.getByRole('main').getByText('Persistent Lifecycle Product', { exact: true })).toBeVisible();
      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reactivate product' })).toBeVisible();

      await context.clearCookies();
      await signIn(page, fixture.managerEmail, PASSWORD);
      await page.goto('/dashboard/products');

      await expect(page.getByRole('main').getByText('Persistent Lifecycle Product', { exact: true })).toBeVisible();
      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('product list keeps active products ahead of inactive products and sorts names within each status', async ({ page }) => {
    const fixture = await createFixture();

    try {
      await prisma.product.createMany({
        data: [
          { businessId: fixture.business.id, name: 'Zulu Active Product', sku: 'ZULU-ACTIVE', status: 'ACTIVE' },
          { businessId: fixture.business.id, name: 'Alpha Inactive Product', sku: 'ALPHA-INACTIVE', status: 'INACTIVE' },
          { businessId: fixture.business.id, name: 'Alpha Active Product', sku: 'ALPHA-ACTIVE', status: 'ACTIVE' },
          { businessId: fixture.business.id, name: 'Zulu Inactive Product', sku: 'ZULU-INACTIVE', status: 'INACTIVE' },
        ],
      });

      await signIn(page, fixture.managerEmail, PASSWORD);
      await page.goto('/dashboard/products');

      const cards = page.getByRole('main').locator('[data-slot="card"]');
      await expect(cards).toHaveCount(4);
      await expect(cards.nth(0)).toContainText('Alpha Active Product');
      await expect(cards.nth(0)).toContainText('Active');
      await expect(cards.nth(1)).toContainText('Zulu Active Product');
      await expect(cards.nth(1)).toContainText('Active');
      await expect(cards.nth(2)).toContainText('Alpha Inactive Product');
      await expect(cards.nth(2)).toContainText('Inactive');
      await expect(cards.nth(3)).toContainText('Zulu Inactive Product');
      await expect(cards.nth(3)).toContainText('Inactive');
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('product sidebar navigation integrates list and create routes for a manager', async ({ page }) => {
    const fixture = await createFixture();

    try {
      await signIn(page, fixture.managerEmail, PASSWORD);

      const viewProducts = page.getByRole('link', { name: 'View products', exact: true });
      const addProduct = page.getByRole('link', { name: 'Add product', exact: true });
      await expect(viewProducts).toBeVisible();
      await expect(addProduct).toBeVisible();

      await viewProducts.click();
      await expect(page).toHaveURL(/\/dashboard\/products$/);
      await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

      await addProduct.click();
      await expect(page).toHaveURL(/\/dashboard\/products\/new$/);
      await expect(page.getByLabel('Product name')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add product', exact: true })).toBeVisible();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('deleting a primary vendor preserves its product and clears only the vendor relationship', async () => {
    const fixture = await createFixture();

    try {
      const vendor = await prisma.vendor.create({
        data: {
          businessId: fixture.business.id,
          name: 'Disposable Primary Vendor',
          code: `DISPOSABLE-${randomUUID().slice(0, 6).toUpperCase()}`,
        },
      });
      const product = await prisma.product.create({
        data: {
          businessId: fixture.business.id,
          vendorId: vendor.id,
          name: 'Vendor Independent Product',
          sku: 'VENDOR-INDEPENDENT',
          vendorSku: 'VENDOR-42',
        },
      });

      await prisma.vendor.delete({ where: { id: vendor.id } });

      const persisted = await prisma.product.findUnique({ where: { id: product.id } });
      expect(persisted).not.toBeNull();
      expect(persisted?.vendorId).toBeNull();
      expect(persisted?.name).toBe('Vendor Independent Product');
      expect(persisted?.sku).toBe('VENDOR-INDEPENDENT');
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test('deleting a client business cascades its products without affecting another business', async () => {
    const fixture = await createFixture();

    try {
      const otherBusiness = await prisma.business.create({
        data: {
          organizationId: fixture.organization.id,
          name: 'E2E Product Surviving Business',
          slug: `e2e-product-surviving-${randomUUID()}`,
          code: `PSURV-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });
      const deletedProduct = await prisma.product.create({
        data: {
          businessId: fixture.business.id,
          name: 'Product Removed With Business',
          sku: 'REMOVED-WITH-BUSINESS',
        },
      });
      const survivingProduct = await prisma.product.create({
        data: {
          businessId: otherBusiness.id,
          name: 'Product In Other Business',
          sku: 'SURVIVING-PRODUCT',
        },
      });

      await prisma.business.delete({ where: { id: fixture.business.id } });

      await expect.poll(async () => prisma.product.findUnique({ where: { id: deletedProduct.id } })).toBeNull();
      await expect
        .poll(async () => (await prisma.product.findUnique({ where: { id: survivingProduct.id } }))?.id)
        .toBe(survivingProduct.id);
    } finally {
      await cleanupFixture(fixture);
    }
  });
});
