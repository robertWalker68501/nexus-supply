import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { signIn } from './helpers/auth';
import { createBusinessMembership, createOrganizationMembership, createVerifiedUser, deleteUserByEmail, prisma } from './helpers/db';

const PASSWORD = 'NexusSupply-E2E-Password-42!';
const testEmail = () => `e2e-product-core-${randomUUID()}@example.com`;

test.describe('product core workflow', () => {
  test('MANAGER can create, view, edit, deactivate, and reactivate a product with a primary vendor', async ({ page }) => {
    const ownerEmail = testEmail();
    const managerEmail = testEmail();
    try {
      const owner = await createVerifiedUser({ name: 'E2E Product Owner', email: ownerEmail, password: PASSWORD, role: 'OWNER' });
      const organization = await createOrganizationMembership({ userId: owner.id, organizationName: `E2E Product Org ${randomUUID().slice(0, 8)}`, role: 'OWNER' });
      const manager = await createVerifiedUser({ name: 'E2E Product Manager', email: managerEmail, password: PASSWORD });
      const business = await createBusinessMembership({ userId: manager.id, organizationId: organization.id, businessName: 'E2E Product Business', role: 'MANAGER' });
      const vendor = await prisma.vendor.create({ data: { businessId: business.id, name: 'Pacific Components', code: `PACIFIC-${randomUUID().slice(0, 6).toUpperCase()}` } });

      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/products');
      await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
      await expect(page.getByText('No products yet')).toBeVisible();

      await page.getByRole('link', { name: 'Add product', exact: true }).first().click();
      await page.getByLabel('Product name').fill('Temperature Sensor');
      await page.getByRole('textbox', { name: 'SKU Required', exact: true }).fill('TEMP-100');
      await page.getByLabel('Description').fill('Industrial temperature sensor');
      await page.getByLabel('Unit of measure').fill('Each');
      await page.getByLabel('Primary vendor').click();
      await page.getByRole('option', { name: new RegExp('Pacific Components') }).click();
      await page.getByLabel('Vendor SKU', { exact: true }).fill('PC-TEMP-44');
      await page.getByRole('button', { name: 'Add product', exact: true }).click();

      await expect(page).toHaveURL(/\/dashboard\/products\/[^/]+$/);
      await expect(page.getByRole('main').getByText('Temperature Sensor', { exact: true })).toBeVisible();
      await expect(page.getByText('SKU: TEMP-100')).toBeVisible();
      await expect(
        page
          .getByRole('group', { name: 'Vendor source Pacific Components', exact: true })
          .getByText('Pacific Components', { exact: true }),
      ).toBeVisible();

      const product = await prisma.product.findFirstOrThrow({ where: { businessId: business.id, sku: 'TEMP-100' } });
      expect(product.vendorId).toBe(vendor.id);
      expect(product.vendorSku).toBe('PC-TEMP-44');
      expect(product.status).toBe('ACTIVE');

      await page.getByRole('button', { name: 'Edit product', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/products/${product.id}/edit$`));
      await page.getByLabel('Product name').fill('Temperature Sensor Pro');
      await page.getByLabel('Vendor SKU', { exact: true }).fill('PC-TEMP-45');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/products/${product.id}$`));
      await expect(page.getByRole('main').getByText('Temperature Sensor Pro', { exact: true })).toBeVisible();

      const edited = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(edited.name).toBe('Temperature Sensor Pro');
      expect(edited.vendorSku).toBe('PC-TEMP-45');

      await page.getByRole('button', { name: 'Deactivate product' }).click();
      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
      await expect.poll(async () => (await prisma.product.findUnique({ where: { id: product.id } }))?.status).toBe('INACTIVE');
      await page.getByRole('button', { name: 'Reactivate product' }).click();
      await expect(page.getByText('Active', { exact: true })).toBeVisible();

      await page.goto('/dashboard/products');
      await expect(page.getByRole('main').getByText('Temperature Sensor Pro', { exact: true })).toBeVisible();
      await expect(page.getByText('SKU: TEMP-100')).toBeVisible();
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });
});
