import { expect, test } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';

import {
  createBusinessMembership,
  createOrganizationMembership,
  createVerifiedUser,
  deleteUserByEmail,
  prisma,
} from './helpers/db';

const PASSWORD = 'E2e-Test-Password-123!';

function testEmail(label: string) {
  return `e2e-${label}-${randomUUID()}@example.test`;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function createInvitation(options: {
  businessId: string;
  email: string;
  role?: 'CLIENT_ADMIN' | 'MANAGER' | 'RECEIVING' | 'SHIPPING' | 'CUSTOMER_SERVICE' | 'VIEWER';
  invitedById: string;
  expiresAt?: Date;
}) {
  const token = randomUUID();
  const invitation = await prisma.businessInvitation.create({
    data: {
      businessId: options.businessId,
      email: options.email.toLowerCase(),
      role: options.role ?? 'RECEIVING',
      tokenHash: hashToken(token),
      invitedById: options.invitedById,
      expiresAt: options.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return { invitation, token };
}

async function createFixture(label: string) {
  const ownerEmail = testEmail(`${label}-owner`);
  const owner = await createVerifiedUser({
    name: `E2E ${label} Owner`,
    email: ownerEmail,
    password: PASSWORD,
    role: 'OWNER',
  });
  const organization = await createOrganizationMembership({
    userId: owner.id,
    organizationName: `E2E ${label} Org ${randomUUID().slice(0, 8)}`,
    role: 'OWNER',
  });
  const adminEmail = testEmail(`${label}-admin`);
  const admin = await createVerifiedUser({
    name: `E2E ${label} Client Admin`,
    email: adminEmail,
    password: PASSWORD,
  });
  const business = await createBusinessMembership({
    userId: admin.id,
    organizationId: organization.id,
    businessName: `E2E ${label} Business`,
    role: 'CLIENT_ADMIN',
  });

  return { ownerEmail, owner, organization, adminEmail, admin, business };
}

test.describe('client-business invitation workflow', () => {
  test('invited existing user signs in through the invitation and receives the invited role', async ({ page }) => {
    const fixture = await createFixture('Invitation Accept');
    const inviteeEmail = testEmail('invitation-accept-member');
    const invitee = await createVerifiedUser({
      name: 'E2E Invited Member',
      email: inviteeEmail,
      password: PASSWORD,
    });
    const { invitation, token } = await createInvitation({
      businessId: fixture.business.id,
      email: inviteeEmail,
      role: 'SHIPPING',
      invitedById: fixture.admin.id,
    });

    try {
      await page.goto(`/invite/${token}`);
      await expect(page.getByText(`Join ${fixture.business.name}`, { exact: true })).toBeVisible();
      await expect(page.getByText('You were invited as Shipping.', { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/sign-in\?callbackURL=/);
      await page.getByLabel('Email').fill(inviteeEmail);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/invite/${token}$`), { timeout: 15_000 });

      await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

      const membership = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: fixture.business.id, userId: invitee.id } },
      });
      expect(membership?.role).toBe('SHIPPING');

      const accepted = await prisma.businessInvitation.findUnique({ where: { id: invitation.id } });
      expect(accepted?.status).toBe('ACCEPTED');
      expect(accepted?.acceptedAt).not.toBeNull();
    } finally {
      await deleteUserByEmail(inviteeEmail);
      await deleteUserByEmail(fixture.adminEmail);
      await deleteUserByEmail(fixture.ownerEmail);
    }
  });

  test('expired, invalid, and already accepted invitation tokens cannot be used', async ({ page }) => {
    const fixture = await createFixture('Invitation Invalid');
    const inviteeEmail = testEmail('invitation-invalid-member');
    const invitee = await createVerifiedUser({ name: 'E2E Invalid Invite Member', email: inviteeEmail, password: PASSWORD });
    const expired = await createInvitation({
      businessId: fixture.business.id,
      email: inviteeEmail,
      invitedById: fixture.admin.id,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const accepted = await createInvitation({
      businessId: fixture.business.id,
      email: inviteeEmail,
      invitedById: fixture.admin.id,
    });
    await prisma.businessInvitation.update({
      where: { id: accepted.invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    try {
      for (const token of [expired.token, accepted.token, randomUUID()]) {
        await page.goto(`/invite/${token}`);
        await expect(page.getByText('Invitation unavailable', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Accept invitation' })).toHaveCount(0);
      }
      expect(await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: fixture.business.id, userId: invitee.id } },
      })).toBeNull();
    } finally {
      await deleteUserByEmail(inviteeEmail);
      await deleteUserByEmail(fixture.adminEmail);
      await deleteUserByEmail(fixture.ownerEmail);
    }
  });

  test('an invitation cannot be accepted by a different signed-in account', async ({ page }) => {
    const fixture = await createFixture('Invitation Email Boundary');
    const invitedEmail = testEmail('invited-email');
    const otherEmail = testEmail('other-email');
    const invited = await createVerifiedUser({ name: 'E2E Intended Invitee', email: invitedEmail, password: PASSWORD });
    const other = await createVerifiedUser({ name: 'E2E Wrong Invitee', email: otherEmail, password: PASSWORD });
    const { invitation, token } = await createInvitation({
      businessId: fixture.business.id,
      email: invitedEmail,
      role: 'MANAGER',
      invitedById: fixture.admin.id,
    });

    try {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill(otherEmail);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

      await page.goto(`/invite/${token}`);
      await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/invite/${token}\\?error=email$`));
      await expect(page.getByText('Different account signed in', { exact: true })).toBeVisible();

      expect(await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: fixture.business.id, userId: other.id } },
      })).toBeNull();
      expect(await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: fixture.business.id, userId: invited.id } },
      })).toBeNull();
      expect((await prisma.businessInvitation.findUnique({ where: { id: invitation.id } }))?.status).toBe('PENDING');
    } finally {
      await deleteUserByEmail(otherEmail);
      await deleteUserByEmail(invitedEmail);
      await deleteUserByEmail(fixture.adminEmail);
      await deleteUserByEmail(fixture.ownerEmail);
    }
  });

  test('platform accounts cannot accept client-business invitations', async ({ page }) => {
    const fixture = await createFixture('Invitation Platform Boundary');
    const platformEmail = testEmail('platform-invitee');
    const platformUser = await createVerifiedUser({
      name: 'E2E Platform Invitee', email: platformEmail, password: PASSWORD, role: 'ADMIN',
    });
    const { invitation, token } = await createInvitation({
      businessId: fixture.business.id,
      email: platformEmail,
      role: 'CLIENT_ADMIN',
      invitedById: fixture.admin.id,
    });

    try {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill(platformEmail);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

      await page.goto(`/invite/${token}`);
      await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/invite/${token}\\?error=platform$`));
      await expect(page.getByText('Platform account cannot accept', { exact: true })).toBeVisible();

      expect(await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: fixture.business.id, userId: platformUser.id } },
      })).toBeNull();
      expect((await prisma.businessInvitation.findUnique({ where: { id: invitation.id } }))?.status).toBe('PENDING');
    } finally {
      await deleteUserByEmail(platformEmail);
      await deleteUserByEmail(fixture.adminEmail);
      await deleteUserByEmail(fixture.ownerEmail);
    }
  });

  test('accepting an invitation grants access only to the invited business', async ({ page }) => {
    const fixture = await createFixture('Invitation Tenant');
    const otherBusiness = await prisma.business.create({
      data: {
        organizationId: fixture.organization.id,
        name: 'E2E Uninvited Business',
        slug: `e2e-uninvited-${randomUUID()}`,
        code: `E2E-${randomUUID().slice(0, 8).toUpperCase()}`,
      },
    });
    const inviteeEmail = testEmail('tenant-invitee');
    const invitee = await createVerifiedUser({ name: 'E2E Tenant Invitee', email: inviteeEmail, password: PASSWORD });
    const { token } = await createInvitation({
      businessId: fixture.business.id,
      email: inviteeEmail,
      role: 'VIEWER',
      invitedById: fixture.admin.id,
    });

    try {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill(inviteeEmail);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

      await page.goto(`/invite/${token}`);
      await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

      const memberships = await prisma.businessMember.findMany({
        where: { userId: invitee.id },
        orderBy: { businessId: 'asc' },
      });
      expect(memberships).toHaveLength(1);
      expect(memberships[0]?.businessId).toBe(fixture.business.id);
      expect(memberships[0]?.role).toBe('VIEWER');

      await page.goto(`/dashboard/businesses/${otherBusiness.id}/members`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    } finally {
      await deleteUserByEmail(inviteeEmail);
      await deleteUserByEmail(fixture.adminEmail);
      await deleteUserByEmail(fixture.ownerEmail);
    }
  });
});
