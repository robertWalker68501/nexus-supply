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
  return `e2e-vendor-core-${randomUUID()}@example.com`;
}

test.describe('vendor core workflow', () => {
  test('MANAGER can create, view, edit, deactivate, and reactivate a vendor in the active business', async ({ page }) => {
    const ownerEmail = testEmail();
    const managerEmail = testEmail();

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Vendor Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Vendor Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Vendor Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Vendor Business',
        role: 'MANAGER',
      });

      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/vendors');

      await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();
      await expect(page.getByText('No vendors yet')).toBeVisible();

      await page.getByRole('link', { name: 'Add vendor', exact: true }).first().click();
      await page.getByLabel('Vendor name').fill('Acme Supply Company');
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();

      await expect(page).toHaveURL(/\/dashboard\/vendors\/[^/]+$/);
      await expect(page.getByRole('main').getByText('Acme Supply Company', { exact: true })).toBeVisible();
      await expect(page.getByText('Vendor code: ACME-SUPPLY-COMPANY')).toBeVisible();

      const vendor = await prisma.vendor.findFirstOrThrow({
        where: { businessId: business.id, name: 'Acme Supply Company' },
      });
      expect(vendor.status).toBe('ACTIVE');
      expect(vendor.code).toBe('ACME-SUPPLY-COMPANY');

      await page.getByRole('button', { name: 'Edit vendor', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/vendors/${vendor.id}/edit$`));
      await page.getByLabel('Vendor name').fill('Acme Industrial Supply');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/vendors/${vendor.id}$`));
      await expect(page.getByRole('main').getByText('Acme Industrial Supply', { exact: true })).toBeVisible();

      const editedVendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendor.id } });
      expect(editedVendor.name).toBe('Acme Industrial Supply');
      expect(editedVendor.code).toBe('ACME-SUPPLY-COMPANY');

      await page.getByRole('button', { name: 'Deactivate vendor' }).click();
      await expect(page.getByText('Inactive', { exact: true })).toBeVisible();
      await expect.poll(async () => (await prisma.vendor.findUnique({ where: { id: vendor.id } }))?.status).toBe('INACTIVE');

      await page.getByRole('button', { name: 'Reactivate vendor' }).click();
      await expect(page.getByText('Active', { exact: true })).toBeVisible();
      await expect.poll(async () => (await prisma.vendor.findUnique({ where: { id: vendor.id } }))?.status).toBe('ACTIVE');

      await page.goto('/dashboard/vendors');
      await expect(page.getByRole('main').getByText('Acme Industrial Supply', { exact: true })).toBeVisible();
      await expect(page.getByText('ACME-SUPPLY-COMPANY', { exact: true })).toBeVisible();
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });
});
