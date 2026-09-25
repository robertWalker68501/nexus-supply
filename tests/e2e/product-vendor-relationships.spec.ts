import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { signIn } from './helpers/auth';
import { createBusinessMembership, createOrganizationMembership, createVerifiedUser, deleteUserByEmail, prisma } from './helpers/db';

const password = 'Password123!';

test.describe('product vendor relationships', () => {
  test('MANAGER can add multiple vendor sources and choose the preferred vendor', async ({ page }) => {
    const email = `e2e-product-sources-${randomUUID()}@example.com`;
    const user = await createVerifiedUser({ name: 'E2E Product Source Manager', email, password });
    const organization = await createOrganizationMembership({ userId: user.id, organizationName: 'E2E Product Source Org', role: 'ADMIN' });
    const business = await createBusinessMembership({ userId: user.id, organizationId: organization.id, businessName: 'E2E Product Source Business', role: 'MANAGER' });
    try {
      const [vendorA, vendorB] = await Promise.all([
        prisma.vendor.create({ data: { businessId: business.id, name: 'Alpha Supply', code: `ALPHA-${randomUUID().slice(0, 6)}` } }),
        prisma.vendor.create({ data: { businessId: business.id, name: 'Beta Supply', code: `BETA-${randomUUID().slice(0, 6)}` } }),
      ]);
      await signIn(page, email, password);
      await page.goto('/dashboard/products/new');
      await page.getByLabel('Product name').fill('Multi Source Sensor');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('MULTI-100');
      await page.getByLabel('Primary vendor').click();
      await page.getByRole('option', { name: new RegExp(`^${vendorA.name}`) }).click();
      await page.getByLabel('Vendor SKU', { exact: true }).fill('ALPHA-100');
      await page.getByRole('button', { name: 'Add product', exact: true }).click();
      await expect(page.getByText('Alpha Supply').first()).toBeVisible();
      await expect(page.getByText('Preferred', { exact: true })).toBeVisible();

      await page.getByLabel('Vendor', { exact: true }).click();
      await page.getByRole('option', { name: new RegExp(`^${vendorB.name}`) }).click();
      await page.getByLabel('Vendor SKU', { exact: true }).last().fill('BETA-100');
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      const betaRow = page.getByRole('group', {
        name: 'Vendor source Beta Supply',
        exact: true,
      });
      await expect(betaRow).toBeVisible();
      await expect(betaRow).toContainText('BETA-100');

      await betaRow.getByRole('button', { name: 'Make preferred', exact: true }).click();
      await expect(betaRow.getByText('Preferred', { exact: true })).toBeVisible();
      const product = await prisma.product.findUnique({ where: { businessId_sku: { businessId: business.id, sku: 'MULTI-100' } } });
      expect(product?.vendorId).toBe(vendorB.id);
      expect(product?.vendorSku).toBe('BETA-100');
      expect(await prisma.productVendor.count({ where: { productId: product!.id } })).toBe(2);
    } finally { await deleteUserByEmail(email); }
  });

  test('linked and cross-business vendors cannot be added again', async ({ page }) => {
    const email = `e2e-product-source-boundary-${randomUUID()}@example.com`;
    const user = await createVerifiedUser({ name: 'E2E Product Boundary Manager', email, password });
    const organization = await createOrganizationMembership({ userId: user.id, organizationName: 'E2E Product Boundary Org', role: 'ADMIN' });
    const business = await createBusinessMembership({ userId: user.id, organizationId: organization.id, businessName: 'E2E Product Boundary Business', role: 'MANAGER' });
    try {
      const otherBusiness = await prisma.business.create({ data: { organizationId: organization.id, name: 'Other Business', slug: `other-${randomUUID()}` } });
      const [linkedVendor, availableVendor, otherVendor] = await Promise.all([
        prisma.vendor.create({ data: { businessId: business.id, name: 'Linked Vendor', code: `LINKED-${randomUUID().slice(0, 6)}` } }),
        prisma.vendor.create({ data: { businessId: business.id, name: 'Available Vendor', code: `AVAILABLE-${randomUUID().slice(0, 6)}` } }),
        prisma.vendor.create({ data: { businessId: otherBusiness.id, name: 'Foreign Vendor', code: `FOREIGN-${randomUUID().slice(0, 6)}` } }),
      ]);
      const product = await prisma.product.create({ data: { businessId: business.id, name: 'Boundary Product', sku: 'BOUNDARY-100', sources: { create: { vendorId: linkedVendor.id } } } });
      await signIn(page, email, password);
      await page.goto(`/dashboard/products/${product.id}`);
      await expect(page.getByText('Linked Vendor')).toBeVisible();
      await page.getByLabel('Vendor', { exact: true }).click();
      await expect(page.getByRole('option', { name: new RegExp(`^${availableVendor.name}`) })).toBeVisible();
      await expect(page.getByRole('option', { name: new RegExp(`^${linkedVendor.name}`) })).toHaveCount(0);
      await expect(page.getByRole('option', { name: new RegExp(`^${otherVendor.name}`) })).toHaveCount(0);
      expect(await prisma.productVendor.count({ where: { productId: product.id } })).toBe(1);
    } finally { await deleteUserByEmail(email); }
  });

  test('removing the preferred vendor preserves the product and clears its primary vendor', async ({ page }) => {
    const email = `e2e-product-source-remove-${randomUUID()}@example.com`;
    const user = await createVerifiedUser({ name: 'E2E Product Remove Manager', email, password });
    const organization = await createOrganizationMembership({ userId: user.id, organizationName: 'E2E Product Remove Org', role: 'ADMIN' });
    const business = await createBusinessMembership({ userId: user.id, organizationId: organization.id, businessName: 'E2E Product Remove Business', role: 'MANAGER' });
    try {
      const vendor = await prisma.vendor.create({ data: { businessId: business.id, name: 'Preferred Vendor', code: `PREF-${randomUUID().slice(0, 6)}` } });
      const product = await prisma.product.create({ data: { businessId: business.id, vendorId: vendor.id, vendorSku: 'PREF-1', name: 'Removal Product', sku: 'REMOVE-100', sources: { create: { vendorId: vendor.id, vendorSku: 'PREF-1', preferred: true } } } });
      await signIn(page, email, password);
      await page.goto(`/dashboard/products/${product.id}`);
      const row = page.locator('div.rounded-lg.border').filter({ hasText: 'Preferred Vendor' });
      await row.getByRole('button', { name: 'Remove Preferred Vendor' }).click();
      await expect(page.getByRole('heading', { name: 'Remove Preferred Vendor?' })).toBeVisible();
      await expect(page.getByText(/clear the product’s primary vendor and vendor SKU/)).toBeVisible();

      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(row.getByText('Preferred Vendor', { exact: true })).toBeVisible();
      expect(await prisma.productVendor.count({ where: { productId: product.id } })).toBe(1);

      await row.getByRole('button', { name: 'Remove Preferred Vendor' }).click();
      await page.getByRole('button', { name: 'Remove vendor', exact: true }).click();
      await expect(page.getByText('No vendor sources added.')).toBeVisible();
      const persisted = await prisma.product.findUnique({ where: { id: product.id } });
      expect(persisted).not.toBeNull();
      expect(persisted?.vendorId).toBeNull();
      expect(persisted?.vendorSku).toBeNull();
    } finally { await deleteUserByEmail(email); }
  });
});
