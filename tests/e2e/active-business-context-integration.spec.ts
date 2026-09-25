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

function testEmail(label: string) {
  return `e2e-${label}-${randomUUID()}@example.com`;
}

test.describe('active-business context and integration', () => {
  test('a multi-business user starts in the first assigned business and can switch business context', async ({ page }) => {
    const ownerEmail = testEmail('active-owner');
    const clientEmail = testEmail('active-client');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Active Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Active Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Active Client',
        email: clientEmail,
        password: PASSWORD,
      });

      const receivingBusiness = await createBusinessMembership({
        userId: client.id,
        organizationId: organization.id,
        businessName: 'E2E Receiving Business',
        role: 'RECEIVING',
      });
      const shippingBusiness = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Shipping Business',
      });
      await addBusinessMembership({
        userId: client.id,
        businessId: shippingBusiness.id,
        role: 'SHIPPING',
      });

      await signIn(page, clientEmail, PASSWORD);

      const selector = page.getByLabel('Active business');
      await expect(selector).toHaveValue(receivingBusiness.id);
      await expect(page.locator('[data-slot="badge"]', { hasText: /^Receiving$/ })).toBeVisible();
      await expect(page.getByRole('main').getByText('E2E Receiving Business', { exact: true })).toBeVisible();

      await selector.selectOption(shippingBusiness.id);

      await expect(selector).toHaveValue(shippingBusiness.id);
      await expect(page.locator('[data-slot="badge"]', { hasText: /^Shipping$/ })).toBeVisible();
      await expect(page.getByRole('main').getByText('E2E Shipping Business', { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Shipping workspace' })).toBeVisible();
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('the selected business persists across dashboard navigation and reloads', async ({ page }) => {
    const ownerEmail = testEmail('persist-owner');
    const clientEmail = testEmail('persist-client');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Persist Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Persist Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Persist Client',
        email: clientEmail,
        password: PASSWORD,
      });

      await createBusinessMembership({
        userId: client.id,
        organizationId: organization.id,
        businessName: 'E2E First Business',
        role: 'VIEWER',
      });
      const secondBusiness = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Persisted Business',
      });
      await addBusinessMembership({
        userId: client.id,
        businessId: secondBusiness.id,
        role: 'MANAGER',
      });

      await signIn(page, clientEmail, PASSWORD);
      const selector = page.getByLabel('Active business');
      await selector.selectOption(secondBusiness.id);

      await expect(selector).toHaveValue(secondBusiness.id);
      await expect(
        page.getByRole('main').getByText('E2E Persisted Business', { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="badge"]', { hasText: /^Manager$/ }),
      ).toBeVisible();

      await page.reload();

      await expect(page.getByLabel('Active business')).toHaveValue(secondBusiness.id);
      await expect(
        page.getByRole('main').getByText('E2E Persisted Business', { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="badge"]', { hasText: /^Manager$/ }),
      ).toBeVisible();
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('a forged active-business cookie cannot select an unassigned tenant', async ({ page, context }) => {
    const ownerAEmail = testEmail('forged-a-owner');
    const ownerBEmail = testEmail('forged-b-owner');
    const clientEmail = testEmail('forged-client');

    try {
      const ownerA = await createVerifiedUser({
        name: 'E2E Forged A Owner',
        email: ownerAEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const ownerB = await createVerifiedUser({
        name: 'E2E Forged B Owner',
        email: ownerBEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organizationA = await createOrganizationMembership({
        userId: ownerA.id,
        organizationName: `E2E Forged A ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const organizationB = await createOrganizationMembership({
        userId: ownerB.id,
        organizationName: `E2E Forged B ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Forged Client',
        email: clientEmail,
        password: PASSWORD,
      });

      const assignedBusiness = await createBusinessMembership({
        userId: client.id,
        organizationId: organizationA.id,
        businessName: 'E2E Assigned Tenant',
        role: 'CUSTOMER_SERVICE',
      });
      const forbiddenBusiness = await createBusiness({
        organizationId: organizationB.id,
        businessName: 'E2E Forbidden Tenant',
      });

      await signIn(page, clientEmail, PASSWORD);

      await context.addCookies([
        {
          name: 'nexus-active-business',
          value: forbiddenBusiness.id,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      await page.reload();

      await expect(page.getByLabel('Active business')).toHaveValue(assignedBusiness.id);
      await expect(page.getByRole('main').getByText('E2E Assigned Tenant', { exact: true })).toBeVisible();
      await expect(page.getByRole('main').getByText('E2E Forbidden Tenant', { exact: true })).toHaveCount(0);
      await expect(page.locator('[data-slot="badge"]', { hasText: /^Customer service$/ })).toBeVisible();
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerBEmail);
      await deleteUserByEmail(ownerAEmail);
    }
  });

  test('platform users do not receive a client-business selector', async ({ page }) => {
    const ownerEmail = testEmail('platform-owner');

    try {
      await createVerifiedUser({
        name: 'E2E Platform Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });

      await signIn(page, ownerEmail, PASSWORD);

      await expect(page.getByLabel('Active business')).toHaveCount(0);
      await expect(page.getByText('Owner', { exact: true })).toBeVisible();
    } finally {
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
