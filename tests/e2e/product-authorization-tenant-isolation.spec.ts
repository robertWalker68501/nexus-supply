import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { signIn } from './helpers/auth';
import {
  addBusinessMembership,
  createBusiness,
  createBusinessMembership,
  createOrganizationMembership,
  createVerifiedUser,
  deleteUserByEmail,
  prisma,
} from './helpers/db';

const PASSWORD = 'NexusSupply-E2E-Password-42!';
const ACTIVE_BUSINESS_COOKIE = 'nexus-active-business';

function testEmail(label: string) {
  return `e2e-product-auth-${label}-${randomUUID()}@example.com`;
}

async function createProduct(businessId: string, name: string) {
  const token = randomUUID().slice(0, 8).toUpperCase();
  return prisma.product.create({
    data: {
      businessId,
      name,
      sku: `E2E-PRODUCT-${token}`,
      unitOfMeasure: 'Each',
    },
  });
}

test.describe('product authorization and tenant isolation', () => {
  test('operational client roles can view products but cannot create, edit, or change product status', async ({ page }) => {
    const ownerEmail = testEmail('readonly-owner');
    const viewerEmail = testEmail('readonly-viewer');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Product Readonly Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Product Readonly Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const viewer = await createVerifiedUser({
        name: 'E2E Product Viewer',
        email: viewerEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: viewer.id,
        organizationId: organization.id,
        businessName: 'E2E Product Readonly Business',
        role: 'VIEWER',
      });
      const product = await createProduct(business.id, 'E2E Readonly Product');

      await signIn(page, viewerEmail, PASSWORD);
      await page.goto('/dashboard/products');

      await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
      await expect(page.getByRole('main').getByText('E2E Readonly Product', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Add product', exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/products/${product.id}`);
      await expect(page.getByRole('main').getByText('E2E Readonly Product', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Edit product' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Deactivate product' })).toHaveCount(0);

      await page.goto('/dashboard/products/new');
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    } finally {
      await deleteUserByEmail(viewerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('a client user cannot view a product that belongs to another business', async ({ page }) => {
    const ownerEmail = testEmail('cross-owner');
    const managerEmail = testEmail('cross-manager');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Product Cross Tenant Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Product Cross Tenant Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Product Cross Tenant Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const businessA = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Product Business A',
        role: 'MANAGER',
      });
      const businessB = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Product Business B',
      });
      const productA = await createProduct(businessA.id, 'E2E Business A Product');
      const productB = await createProduct(businessB.id, 'E2E Business B Secret Product');

      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/products');

      await expect(page.getByRole('main').getByText(productA.name, { exact: true })).toBeVisible();
      await expect(page.getByText(productB.name, { exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/products/${productB.id}`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(page.getByText(productB.name, { exact: true })).toHaveCount(0);
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('product access follows the active business for a user who belongs to multiple businesses', async ({ page, context }) => {
    const ownerEmail = testEmail('multi-owner');
    const managerEmail = testEmail('multi-manager');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Product Multi Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Product Multi Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Product Multi Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const businessA = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Product Active Business A',
        role: 'MANAGER',
      });
      const businessB = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Product Active Business B',
      });
      await addBusinessMembership({ userId: manager.id, businessId: businessB.id, role: 'MANAGER' });

      const productA = await createProduct(businessA.id, 'E2E Active A Product');
      const productB = await createProduct(businessB.id, 'E2E Active B Product');

      await signIn(page, managerEmail, PASSWORD);
      await context.addCookies([
        {
          name: ACTIVE_BUSINESS_COOKIE,
          value: businessA.id,
          url: 'http://localhost:3000',
        },
      ]);
      await page.goto('/dashboard/products');
      await expect(page.getByRole('main').getByText(productA.name, { exact: true })).toBeVisible();
      await expect(page.getByText(productB.name, { exact: true })).toHaveCount(0);

      await context.addCookies([
        {
          name: ACTIVE_BUSINESS_COOKIE,
          value: businessB.id,
          url: 'http://localhost:3000',
        },
      ]);
      await page.goto('/dashboard/products');
      await expect(page.getByRole('main').getByText(productB.name, { exact: true })).toBeVisible();
      await expect(page.getByText(productA.name, { exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/products/${productA.id}`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('platform OWNER does not gain access to client product pages', async ({ page }) => {
    const ownerEmail = testEmail('platform-owner');
    const managerEmail = testEmail('platform-manager');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Product Platform Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Product Platform Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Product Platform Boundary Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Product Platform Boundary Business',
        role: 'MANAGER',
      });
      const product = await createProduct(business.id, 'E2E Platform Boundary Product');

      await signIn(page, ownerEmail, PASSWORD);

      await page.goto('/dashboard/products');
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText(product.name, { exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/products/${product.id}`);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText(product.name, { exact: true })).toHaveCount(0);
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
