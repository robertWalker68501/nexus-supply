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
  getBusinessMembershipForUser,
  prisma,
} from './helpers/db';

const PASSWORD = 'NexusSupply-E2E-Password-42!';

function testEmail(label: string) {
  return `e2e-${label}-${randomUUID()}@example.com`;
}

test.describe('client-business membership and tenant isolation', () => {
  test('a client user receives only the membership assigned to that business', async () => {
    const ownerEmail = testEmail('membership-owner');
    const clientEmail = testEmail('membership-client');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Membership Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Membership Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Receiving Member',
        email: clientEmail,
        password: PASSWORD,
      });

      const assignedBusiness = await createBusinessMembership({
        userId: client.id,
        organizationId: organization.id,
        businessName: 'E2E Assigned Business',
        role: 'RECEIVING',
      });
      const unassignedBusiness = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Unassigned Business',
      });

      const assignedMembership = await getBusinessMembershipForUser(client.id, assignedBusiness.id);
      const unassignedMembership = await getBusinessMembershipForUser(client.id, unassignedBusiness.id);

      expect(assignedMembership?.role).toBe('RECEIVING');
      expect(assignedMembership?.businessId).toBe(assignedBusiness.id);
      expect(unassignedMembership).toBeNull();
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('the same user can have different roles in different client businesses', async () => {
    const ownerEmail = testEmail('multi-role-owner');
    const clientEmail = testEmail('multi-role-client');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Multi Role Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Multi Role Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Multi Role Client',
        email: clientEmail,
        password: PASSWORD,
      });

      const receivingBusiness = await createBusinessMembership({
        userId: client.id,
        organizationId: organization.id,
        businessName: 'E2E Receiving Tenant',
        role: 'RECEIVING',
      });
      const shippingBusiness = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Shipping Tenant',
      });
      await addBusinessMembership({
        userId: client.id,
        businessId: shippingBusiness.id,
        role: 'SHIPPING',
      });

      const receivingMembership = await getBusinessMembershipForUser(client.id, receivingBusiness.id);
      const shippingMembership = await getBusinessMembershipForUser(client.id, shippingBusiness.id);

      expect(receivingMembership?.role).toBe('RECEIVING');
      expect(shippingMembership?.role).toBe('SHIPPING');
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('membership in one organization does not leak into another organization tenant', async () => {
    const ownerAEmail = testEmail('tenant-a-owner');
    const ownerBEmail = testEmail('tenant-b-owner');
    const clientEmail = testEmail('tenant-client');

    try {
      const ownerA = await createVerifiedUser({
        name: 'E2E Tenant A Owner',
        email: ownerAEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const ownerB = await createVerifiedUser({
        name: 'E2E Tenant B Owner',
        email: ownerBEmail,
        password: PASSWORD,
        role: 'OWNER',
      });

      const organizationA = await createOrganizationMembership({
        userId: ownerA.id,
        organizationName: `E2E Tenant A ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const organizationB = await createOrganizationMembership({
        userId: ownerB.id,
        organizationName: `E2E Tenant B ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Isolated Client',
        email: clientEmail,
        password: PASSWORD,
      });

      const businessA = await createBusinessMembership({
        userId: client.id,
        organizationId: organizationA.id,
        businessName: 'E2E Tenant A Business',
        role: 'MANAGER',
      });
      const businessB = await createBusiness({
        organizationId: organizationB.id,
        businessName: 'E2E Tenant B Business',
      });

      expect(await getBusinessMembershipForUser(client.id, businessA.id)).not.toBeNull();
      expect(await getBusinessMembershipForUser(client.id, businessB.id)).toBeNull();
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerBEmail);
      await deleteUserByEmail(ownerAEmail);
    }
  });

  test('duplicate membership for the same user and business is rejected', async () => {
    const ownerEmail = testEmail('duplicate-owner');
    const clientEmail = testEmail('duplicate-client');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Duplicate Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Duplicate Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Duplicate Client',
        email: clientEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: client.id,
        organizationId: organization.id,
        businessName: 'E2E Duplicate Business',
        role: 'VIEWER',
      });

      await expect(
        addBusinessMembership({
          userId: client.id,
          businessId: business.id,
          role: 'MANAGER',
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      const memberships = await prisma.businessMember.findMany({
        where: { userId: client.id, businessId: business.id },
      });
      expect(memberships).toHaveLength(1);
      expect(memberships[0]?.role).toBe('VIEWER');
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('a client-business role is reflected in the signed-in user interface without platform navigation', async ({ page }) => {
    const ownerEmail = testEmail('ui-owner');
    const clientEmail = testEmail('ui-client');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E UI Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E UI Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const client = await createVerifiedUser({
        name: 'E2E Shipping Client',
        email: clientEmail,
        password: PASSWORD,
      });
      await createBusinessMembership({
        userId: client.id,
        organizationId: organization.id,
        businessName: 'E2E Shipping Business',
        role: 'SHIPPING',
      });

      await signIn(page, clientEmail, PASSWORD);

      await expect(page.getByText('SHIPPING', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Client businesses' })).toHaveCount(0);
    } finally {
      await deleteUserByEmail(clientEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
