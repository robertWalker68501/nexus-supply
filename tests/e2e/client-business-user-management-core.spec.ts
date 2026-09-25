import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { signIn } from './helpers/auth';
import {
  createBusiness,
  createOrganizationMembership,
  createVerifiedUser,
  deleteUserByEmail,
  prisma,
} from './helpers/db';

const PASSWORD = 'NexusSupply-E2E-Password-42!';
const email = (label: string) => `e2e-${label}-${randomUUID()}@example.com`;

test.describe('client-business user management core workflow', () => {
  test('platform owner immediately assigns an existing account as initial CLIENT_ADMIN', async ({ page }) => {
    const ownerEmail = email('owner');
    const adminEmail = email('admin');
    try {
      const owner = await createVerifiedUser({ name: 'E2E Owner', email: ownerEmail, password: PASSWORD, role: 'OWNER' });
      const org = await createOrganizationMembership({ userId: owner.id, organizationName: `E2E Org ${randomUUID().slice(0,8)}`, role: 'OWNER' });
      const business = await createBusiness({ organizationId: org.id, businessName: 'E2E Existing Admin Business' });
      const admin = await createVerifiedUser({ name: 'E2E Client Admin', email: adminEmail, password: PASSWORD });

      await signIn(page, ownerEmail, PASSWORD);
      await page.goto('/dashboard/businesses');
      const card = page.locator('[data-slot="card"]').filter({ hasText: 'E2E Existing Admin Business' });
      await card.getByLabel('Client administrator email').fill(adminEmail);
      await card.getByRole('button', { name: 'Assign client administrator' }).click();
      await expect(card.getByText('E2E Client Admin', { exact: true })).toBeVisible();

      const membership = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: business.id, userId: admin.id } },
      });
      expect(membership?.role).toBe('CLIENT_ADMIN');
    } finally {
      await deleteUserByEmail(adminEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('platform owner creates a pending CLIENT_ADMIN invitation when the account does not exist', async ({ page }) => {
    const ownerEmail = email('invite-owner');
    const invitedEmail = email('invited-admin');
    try {
      const owner = await createVerifiedUser({ name: 'E2E Invite Owner', email: ownerEmail, password: PASSWORD, role: 'OWNER' });
      const org = await createOrganizationMembership({ userId: owner.id, organizationName: `E2E Invite Org ${randomUUID().slice(0,8)}`, role: 'OWNER' });
      const business = await createBusiness({ organizationId: org.id, businessName: 'E2E Invited Admin Business' });

      await signIn(page, ownerEmail, PASSWORD);
      await page.goto('/dashboard/businesses');
      const card = page.locator('[data-slot="card"]').filter({ hasText: 'E2E Invited Admin Business' });
      await card.getByLabel('Client administrator email').fill(invitedEmail);
      await card.getByRole('button', { name: 'Assign client administrator' }).click();

      await expect(card.getByText('Client administrator invitation pending')).toBeVisible();
      await expect(card.getByText(invitedEmail, { exact: true })).toBeVisible();

      const invitation = await prisma.businessInvitation.findFirst({
        where: { businessId: business.id, email: invitedEmail, status: 'PENDING' },
      });
      expect(invitation?.role).toBe('CLIENT_ADMIN');
      expect(invitation?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    } finally {
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
