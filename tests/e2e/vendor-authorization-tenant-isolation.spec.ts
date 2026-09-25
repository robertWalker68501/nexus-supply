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
const ACTIVE_BUSINESS_COOKIE = 'nexus-active-business';

function testEmail(label: string) {
  return `e2e-vendor-auth-${label}-${randomUUID()}@example.com`;
}

async function createVendor(businessId: string, name: string) {
  const token = randomUUID().slice(0, 8).toUpperCase();
  return prisma.vendor.create({
    data: {
      businessId,
      name,
      code: `E2E-VENDOR-${token}`,
    },
  });
}

test.describe('vendor authorization and tenant isolation', () => {
  test('operational client roles can view vendors but cannot create, edit, or change vendor status', async ({ page }) => {
    const ownerEmail = testEmail('readonly-owner');
    const viewerEmail = testEmail('readonly-viewer');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Vendor Readonly Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Vendor Readonly Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const viewer = await createVerifiedUser({
        name: 'E2E Vendor Viewer',
        email: viewerEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: viewer.id,
        organizationId: organization.id,
        businessName: 'E2E Vendor Readonly Business',
        role: 'VIEWER',
      });
      const vendor = await createVendor(business.id, 'E2E Readonly Vendor');

      await signIn(page, viewerEmail, PASSWORD);
      await page.goto('/dashboard/vendors');

      await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();
      await expect(page.getByRole('main').getByText('E2E Readonly Vendor', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Add vendor', exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/vendors/${vendor.id}`);
      await expect(page.getByRole('main').getByText('E2E Readonly Vendor', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Edit vendor', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Deactivate vendor' })).toHaveCount(0);

      await page.goto(`/dashboard/vendors/${vendor.id}/edit`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();

      await page.goto('/dashboard/vendors/new');
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    } finally {
      await deleteUserByEmail(viewerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('a client user cannot view a vendor that belongs to another business', async ({ page }) => {
    const ownerEmail = testEmail('cross-owner');
    const managerEmail = testEmail('cross-manager');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Vendor Cross Tenant Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Vendor Cross Tenant Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Vendor Cross Tenant Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const businessA = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Vendor Business A',
        role: 'MANAGER',
      });
      const businessB = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Vendor Business B',
      });
      const vendorA = await createVendor(businessA.id, 'E2E Business A Vendor');
      const vendorB = await createVendor(businessB.id, 'E2E Business B Secret Vendor');

      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/vendors');

      await expect(page.getByRole('main').getByText(vendorA.name, { exact: true })).toBeVisible();
      await expect(page.getByText(vendorB.name, { exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/vendors/${vendorB.id}`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();

      await page.goto(`/dashboard/vendors/${vendorB.id}/edit`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(page.getByText(vendorB.name, { exact: true })).toHaveCount(0);
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('vendor access follows the active business for a user who belongs to multiple businesses', async ({ page, context }) => {
    const ownerEmail = testEmail('multi-owner');
    const managerEmail = testEmail('multi-manager');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Vendor Multi Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Vendor Multi Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Vendor Multi Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const businessA = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Vendor Active Business A',
        role: 'MANAGER',
      });
      const businessB = await createBusiness({
        organizationId: organization.id,
        businessName: 'E2E Vendor Active Business B',
      });
      await addBusinessMembership({ userId: manager.id, businessId: businessB.id, role: 'MANAGER' });

      const vendorA = await createVendor(businessA.id, 'E2E Active A Vendor');
      const vendorB = await createVendor(businessB.id, 'E2E Active B Vendor');

      await signIn(page, managerEmail, PASSWORD);
      await context.addCookies([
        {
          name: ACTIVE_BUSINESS_COOKIE,
          value: businessA.id,
          url: 'http://localhost:3000',
        },
      ]);
      await page.goto('/dashboard/vendors');
      await expect(page.getByRole('main').getByText(vendorA.name, { exact: true })).toBeVisible();
      await expect(page.getByText(vendorB.name, { exact: true })).toHaveCount(0);

      await context.addCookies([
        {
          name: ACTIVE_BUSINESS_COOKIE,
          value: businessB.id,
          url: 'http://localhost:3000',
        },
      ]);
      await page.goto('/dashboard/vendors');
      await expect(page.getByRole('main').getByText(vendorB.name, { exact: true })).toBeVisible();
      await expect(page.getByText(vendorA.name, { exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/vendors/${vendorA.id}`);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test('platform OWNER does not gain access to client vendor pages', async ({ page }) => {
    const ownerEmail = testEmail('platform-owner');
    const managerEmail = testEmail('platform-manager');

    try {
      const owner = await createVerifiedUser({
        name: 'E2E Vendor Platform Owner',
        email: ownerEmail,
        password: PASSWORD,
        role: 'OWNER',
      });
      const organization = await createOrganizationMembership({
        userId: owner.id,
        organizationName: `E2E Vendor Platform Org ${randomUUID().slice(0, 8)}`,
        role: 'OWNER',
      });
      const manager = await createVerifiedUser({
        name: 'E2E Vendor Platform Boundary Manager',
        email: managerEmail,
        password: PASSWORD,
      });
      const business = await createBusinessMembership({
        userId: manager.id,
        organizationId: organization.id,
        businessName: 'E2E Vendor Platform Boundary Business',
        role: 'MANAGER',
      });
      const vendor = await createVendor(business.id, 'E2E Platform Boundary Vendor');

      await signIn(page, ownerEmail, PASSWORD);

      await page.goto('/dashboard/vendors');
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText(vendor.name, { exact: true })).toHaveCount(0);

      await page.goto(`/dashboard/vendors/${vendor.id}`);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText(vendor.name, { exact: true })).toHaveCount(0);
    } finally {
      await deleteUserByEmail(managerEmail);
      await deleteUserByEmail(ownerEmail);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
