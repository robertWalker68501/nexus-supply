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

test.describe('platform and organization authorization', () => {
  test('unauthenticated users cannot access client-business administration routes', async ({ page }) => {
    await page.goto('/dashboard/businesses');
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.goto('/dashboard/businesses/new');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('platform OWNER can create an operating workspace and its first client business', async ({ page }) => {
    const email = testEmail('owner');
    const workspaceName = `E2E Owner Workspace ${randomUUID().slice(0, 8)}`;
    const businessName = `E2E Northstar ${randomUUID().slice(0, 8)}`;

    try {
      await createVerifiedUser({ name: 'E2E Platform Owner', email, password: PASSWORD, role: 'OWNER' });
      await signIn(page, email, PASSWORD);

      await page.goto('/dashboard/businesses');
      await expect(page.getByText('Create your NexusSupply workspace', { exact: true })).toBeVisible();
      await page.getByLabel('Workspace name').fill(workspaceName);
      await page.getByRole('button', { name: 'Create workspace' }).click();

      await expect(page).toHaveURL(/\/dashboard\/businesses$/);
      await expect(page.getByRole('heading', { name: 'Client businesses', exact: true })).toBeVisible();
      await expect(page.getByText(workspaceName)).toBeVisible();

      await page.getByRole('button', { name: 'Add business', exact: true }).click();
      await page.getByLabel('Business name').fill(businessName);
      await page.getByRole('button', { name: 'Add business' }).click();

      await expect(page).toHaveURL(/\/dashboard\/businesses$/);
      await expect(page.getByText(businessName, { exact: true })).toBeVisible();
      await expect(page.getByText(`Code: ${businessName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)}`)).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test('platform ADMIN can create an operating workspace', async ({ page }) => {
    const email = testEmail('admin');
    const workspaceName = `E2E Admin Workspace ${randomUUID().slice(0, 8)}`;

    try {
      await createVerifiedUser({ name: 'E2E Platform Admin', email, password: PASSWORD, role: 'ADMIN' });
      await signIn(page, email, PASSWORD);
      await page.goto('/dashboard/businesses');

      await expect(page.getByText('Create your NexusSupply workspace', { exact: true })).toBeVisible();
      await page.getByLabel('Workspace name').fill(workspaceName);
      await page.getByRole('button', { name: 'Create workspace' }).click();

      await expect(page).toHaveURL(/\/dashboard\/businesses$/);
      await expect(page.getByText(workspaceName)).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test('a user without platform or organization authority cannot create a workspace or client business', async ({ page }) => {
    const email = testEmail('unassigned');

    try {
      await createVerifiedUser({ name: 'E2E Unassigned User', email, password: PASSWORD });
      await signIn(page, email, PASSWORD);
      await page.goto('/dashboard/businesses');

      await expect(page.getByText('No workspace access', { exact: true })).toBeVisible();
      await expect(page.getByText('Create your NexusSupply workspace')).toHaveCount(0);

      await page.goto('/dashboard/businesses/new');
      await expect(page).toHaveURL(/\/dashboard\/businesses$/);
      await expect(page.getByText('No workspace access', { exact: true })).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test('client-business roles do not grant platform or organization administration', async ({ page }) => {
    const ownerEmail = testEmail('seed-owner');
    const clientEmail = testEmail('receiving');

    try {
      const owner = await createVerifiedUser({ name: 'E2E Seed Owner', email: ownerEmail, password: PASSWORD, role: 'OWNER' });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Tenant Boundary ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const clientUser = await createVerifiedUser({ name: 'E2E Receiving User', email: clientEmail, password: PASSWORD });
      await createBusinessMembership({
        userId: clientUser.id,
        organizationId: organization.id,
        businessName: 'E2E Receiving Client',
        role: 'RECEIVING',
      });

      await signIn(page, clientEmail, PASSWORD);
      await expect(page.getByRole('link', { name: 'Client businesses' })).toHaveCount(0);

      await page.goto('/dashboard/businesses');
      await expect(page.getByText('No workspace access', { exact: true })).toBeVisible();

      await page.goto('/dashboard/businesses/new');
      await expect(page).toHaveURL(/\/dashboard\/businesses$/);
      await expect(page.getByText('No workspace access', { exact: true })).toBeVisible();
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
