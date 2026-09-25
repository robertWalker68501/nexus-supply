import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  createBusinessMembership,
  createOrganizationMembership,
  createVerifiedUser,
  deleteUserByEmail,
  prisma,
} from './helpers/db';

const email = 'e2e-vendor-contact@example.com';
const password = 'E2eVendorContact!123';

async function setupManager() {
  const user = await createVerifiedUser({ name: 'E2E Vendor Contact Manager', email, password });
  const organization = await createOrganizationMembership({
    userId: user.id,
    organizationName: 'E2E Vendor Contact Organization',
    role: 'ADMIN',
  });
  const business = await createBusinessMembership({
    userId: user.id,
    organizationId: organization.id,
    businessName: 'E2E Vendor Contact Business',
    role: 'MANAGER',
  });
  return { user, organization, business };
}

test.describe('vendor contacts and addresses', () => {
  test.beforeEach(async () => {
    await deleteUserByEmail(email);
  });

  test.afterEach(async () => {
    await deleteUserByEmail(email);
  });

  test('MANAGER can create and update vendor contact and address details', async ({ page }) => {
    const { business } = await setupManager();
    await signIn(page, email, password);

    await page.goto('/dashboard/vendors/new');
    await page.getByLabel('Vendor name').fill('Pacific Components');
    await page.getByLabel('Contact name').fill('  Jordan Lee  ');
    await page.getByLabel('Contact email').fill('  purchasing@pacific.example  ');
    await page.getByLabel('Contact phone').fill('  (408) 555-0182  ');
    await page.getByLabel('Address line 1').fill('  123 Supply Way  ');
    await page.getByLabel('Address line 2').fill('  Suite 400  ');
    await page.getByLabel('City').fill('  San Jose  ');
    await page.getByLabel('State / province').fill('  CA  ');
    await page.getByLabel('Postal code').fill('  95113  ');
    await page.getByLabel('Country').fill('  United States  ');
    await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/vendors\/(?!new(?:\/|$))[^/]+$/);

    await expect(page.getByText('Jordan Lee', { exact: true })).toBeVisible();
    await expect(page.getByText('purchasing@pacific.example', { exact: true })).toBeVisible();
    await expect(page.getByText('(408) 555-0182', { exact: true })).toBeVisible();
    await expect(page.getByText('123 Supply Way', { exact: true })).toBeVisible();
    await expect(page.getByText('San Jose, CA 95113', { exact: true })).toBeVisible();

    const vendor = await prisma.vendor.findFirstOrThrow({
      where: { businessId: business.id, name: 'Pacific Components' },
    });
    expect(vendor.contactName).toBe('Jordan Lee');
    expect(vendor.contactEmail).toBe('purchasing@pacific.example');
    expect(vendor.city).toBe('San Jose');

    await page.getByRole('button', { name: 'Edit vendor', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/vendors/${vendor.id}/edit$`));
    await page.getByLabel('Contact name').fill('Morgan Chen');
    await page.getByLabel('Contact email').fill('orders@pacific.example');
    await page.getByLabel('Address line 2').fill('');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/vendors/${vendor.id}$`));

    await expect(page.getByText('Morgan Chen', { exact: true })).toBeVisible();
    await expect(page.getByText('orders@pacific.example', { exact: true })).toBeVisible();

    const updated = await prisma.vendor.findUniqueOrThrow({ where: { id: vendor.id } });
    expect(updated.contactName).toBe('Morgan Chen');
    expect(updated.contactEmail).toBe('orders@pacific.example');
    expect(updated.addressLine2).toBeNull();
    expect(updated.code).toBe(vendor.code);
  });

  test('contact and address fields are optional and an invalid email does not overwrite persisted details', async ({ page }) => {
    const { business } = await setupManager();
    const vendor = await prisma.vendor.create({
      data: {
        businessId: business.id,
        name: 'Optional Details Vendor',
        code: 'OPTIONAL-DETAILS-VENDOR',
        contactEmail: 'valid@example.com',
      },
    });

    await signIn(page, email, password);
    await page.goto(`/dashboard/vendors/${vendor.id}`);
    await expect(page.getByText('No address added.')).toBeVisible();
    await page.getByRole('button', { name: 'Edit vendor', exact: true }).click();

    await page.getByLabel('Contact email').fill('not-an-email');
    await page.locator('form').filter({ has: page.getByRole('button', { name: 'Save changes', exact: true }) }).evaluate((form) => {
      (form as HTMLFormElement).noValidate = true;
    });
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByText('Enter a valid contact email address.')).toBeVisible();

    const persisted = await prisma.vendor.findUniqueOrThrow({ where: { id: vendor.id } });
    expect(persisted.contactEmail).toBe('valid@example.com');
  });
});
