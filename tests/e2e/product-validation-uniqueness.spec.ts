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
  return `e2e-product-validation-${randomUUID()}@example.com`;
}

async function createManagerFixture() {
  const ownerEmail = testEmail();
  const managerEmail = testEmail();

  const owner = await createVerifiedUser({
    name: 'E2E Product Validation Owner',
    email: ownerEmail,
    password: PASSWORD,
    role: 'OWNER',
  });
  const organization = await createOrganizationMembership({
    userId: owner.id,
    organizationName: `E2E Product Validation Org ${randomUUID().slice(0, 8)}`,
    role: 'OWNER',
  });
  const manager = await createVerifiedUser({
    name: 'E2E Product Validation Manager',
    email: managerEmail,
    password: PASSWORD,
  });
  const business = await createBusinessMembership({
    userId: manager.id,
    organizationId: organization.id,
    businessName: `E2E Product Validation Business ${randomUUID().slice(0, 8)}`,
    role: 'MANAGER',
  });

  return { ownerEmail, managerEmail, business };
}

async function cleanupFixture(ownerEmail: string, managerEmail: string) {
  await deleteUserByEmail(managerEmail);
  await deleteUserByEmail(ownerEmail);
}

async function submitAddProduct(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
}

test.describe('product validation and uniqueness', () => {
  test('required product fields reject whitespace-only values', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/products/new');

      await page.getByLabel('Product name').fill('   ');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('VALID-100');
      await submitAddProduct(page);
      await expect(page.getByText('Product name is required.')).toBeVisible();

      await page.getByLabel('Product name').fill('Valid Product');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('   ');
      await submitAddProduct(page);
      await expect(page.getByText('SKU is required.')).toBeVisible();

      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('VALID-100');
      await page.getByLabel('Unit of measure').fill('   ');
      await submitAddProduct(page);
      await expect(page.getByText('Unit of measure is required.')).toBeVisible();

      await expect(prisma.product.count({ where: { businessId: business.id } })).resolves.toBe(0);
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });

  test('product fields are trimmed and enforce their maximum lengths', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/products/new');

      await page.getByLabel('Product name').fill('A'.repeat(121));
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('LIMIT-100');
      await submitAddProduct(page);
      await expect(page.getByText('Product name must be 120 characters or fewer.')).toBeVisible();

      await page.getByLabel('Product name').fill('Valid Product');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('S'.repeat(61));
      await submitAddProduct(page);
      await expect(page.getByText('SKU must be 60 characters or fewer.')).toBeVisible();

      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('   TRIM-100   ');
      await page.getByLabel('Product name').fill('   Trimmed Product   ');
      await page.getByLabel('Description').fill('   Trimmed description   ');
      await page.getByLabel('Unit of measure').fill('   Case   ');
      await page.getByLabel('Vendor SKU', { exact: true }).fill('   VENDOR-TRIM   ');
      await submitAddProduct(page);
      await expect(page).toHaveURL(/\/dashboard\/products\/(?!new(?:\/|$))[^/]+$/);

      const product = await prisma.product.findFirstOrThrow({ where: { businessId: business.id } });
      expect(product.name).toBe('Trimmed Product');
      expect(product.sku).toBe('TRIM-100');
      expect(product.description).toBe('Trimmed description');
      expect(product.unitOfMeasure).toBe('Case');
      expect(product.vendorSku).toBe('VENDOR-TRIM');
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });

  test('SKU must be unique within the active business', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      await prisma.product.create({
        data: { businessId: business.id, name: 'Existing Product', sku: 'DUP-100', unitOfMeasure: 'Each' },
      });

      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/products/new');
      await page.getByLabel('Product name').fill('Duplicate Product');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('  DUP-100  ');
      await submitAddProduct(page);

      await expect(page.getByText('A product with this SKU already exists.')).toBeVisible();
      await expect(prisma.product.count({ where: { businessId: business.id } })).resolves.toBe(1);
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });

  test('invalid or duplicate edits do not overwrite persisted product data', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      const product = await prisma.product.create({
        data: {
          businessId: business.id,
          name: 'Persistent Product',
          sku: 'KEEP-100',
          description: 'Original description',
          unitOfMeasure: 'Each',
        },
      });
      await prisma.product.create({
        data: { businessId: business.id, name: 'Other Product', sku: 'TAKEN-100', unitOfMeasure: 'Case' },
      });

      await signIn(page, managerEmail, PASSWORD);
      await page.goto(`/dashboard/products/${product.id}/edit`);

      await page.getByLabel('Product name').fill('B'.repeat(121));
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await expect(page.getByText('Product name must be 120 characters or fewer.')).toBeVisible();

      let persisted = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(persisted.name).toBe('Persistent Product');
      expect(persisted.sku).toBe('KEEP-100');
      expect(persisted.description).toBe('Original description');

      await page.getByLabel('Product name').fill('Changed Product');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('TAKEN-100');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await expect(page.getByText('A product with this SKU already exists.')).toBeVisible();

      persisted = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(persisted.name).toBe('Persistent Product');
      expect(persisted.sku).toBe('KEEP-100');
      expect(persisted.description).toBe('Original description');
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });
});
