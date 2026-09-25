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
  return `e2e-vendor-validation-${randomUUID()}@example.com`;
}

async function createManagerFixture() {
  const ownerEmail = testEmail();
  const managerEmail = testEmail();

  const owner = await createVerifiedUser({
    name: 'E2E Vendor Validation Owner',
    email: ownerEmail,
    password: PASSWORD,
    role: 'OWNER',
  });
  const organization = await createOrganizationMembership({
    userId: owner.id,
    organizationName: `E2E Vendor Validation Org ${randomUUID().slice(0, 8)}`,
    role: 'OWNER',
  });
  const manager = await createVerifiedUser({
    name: 'E2E Vendor Validation Manager',
    email: managerEmail,
    password: PASSWORD,
  });
  const business = await createBusinessMembership({
    userId: manager.id,
    organizationId: organization.id,
    businessName: `E2E Vendor Validation Business ${randomUUID().slice(0, 8)}`,
    role: 'MANAGER',
  });

  return { ownerEmail, managerEmail, business };
}

async function cleanupFixture(ownerEmail: string, managerEmail: string) {
  await deleteUserByEmail(managerEmail);
  await deleteUserByEmail(ownerEmail);
}

test.describe('vendor validation and uniqueness', () => {
  test('vendor names are required, trimmed, and limited to 100 characters', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      await signIn(page, managerEmail, PASSWORD);
      await page.goto('/dashboard/vendors/new');

      await page.getByLabel('Vendor name').fill('   ');
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page.getByText('Vendor name is required.')).toBeVisible();
      await expect(prisma.vendor.count({ where: { businessId: business.id } })).resolves.toBe(0);

      await page.getByLabel('Vendor name').fill('A'.repeat(101));
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page.getByText('Vendor name must be 100 characters or fewer.')).toBeVisible();
      await expect(prisma.vendor.count({ where: { businessId: business.id } })).resolves.toBe(0);

      await page.getByLabel('Vendor name').fill('   Trimmed Vendor Name   ');
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/vendors\/(?!new(?:\/|$))[^/]+$/);

      const vendor = await prisma.vendor.findFirstOrThrow({
        where: { businessId: business.id },
      });
      expect(vendor.name).toBe('Trimmed Vendor Name');
      expect(vendor.code).toBe('TRIMMED-VENDOR-NAME');
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });

  test('generated vendor codes remain unique within a business when names collide', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      await signIn(page, managerEmail, PASSWORD);

      await page.goto('/dashboard/vendors/new');
      await page.getByLabel('Vendor name').fill('Acme Supply');
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page.getByText('Vendor code: ACME-SUPPLY')).toBeVisible();

      await page.goto('/dashboard/vendors/new');
      await page.getByLabel('Vendor name').fill('Acme Supply');
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page.getByText('Vendor code: ACME-SUPPLY-2')).toBeVisible();

      const vendors = await prisma.vendor.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(vendors).toHaveLength(2);
      expect(vendors.map((vendor) => vendor.code).sort()).toEqual(['ACME-SUPPLY', 'ACME-SUPPLY-2']);
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });

  test('code collisions caused by truncation receive a unique suffix without exceeding 24 characters', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      await signIn(page, managerEmail, PASSWORD);
      const longName = 'Twenty Four Character Vendor Prefix Alpha';

      await page.goto('/dashboard/vendors/new');
      await page.getByLabel('Vendor name').fill(longName);
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/vendors\/(?!new(?:\/|$))[^/]+$/);

      await page.goto('/dashboard/vendors/new');
      await page.getByLabel('Vendor name').fill(longName);
      await page.getByRole('button', { name: 'Add vendor', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/vendors\/(?!new(?:\/|$))[^/]+$/);

      const vendors = await prisma.vendor.findMany({
        where: { businessId: business.id },
        select: { code: true },
      });
      expect(vendors).toHaveLength(2);
      expect(new Set(vendors.map((vendor) => vendor.code)).size).toBe(2);
      expect(vendors.every((vendor) => vendor.code.length <= 24)).toBe(true);
      expect(vendors.some((vendor) => vendor.code.endsWith('-2'))).toBe(true);
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });

  test('invalid edits do not overwrite the persisted vendor name or regenerate its code', async ({ page }) => {
    const { ownerEmail, managerEmail, business } = await createManagerFixture();

    try {
      const vendor = await prisma.vendor.create({
        data: {
          businessId: business.id,
          name: 'Persistent Vendor',
          code: 'PERSISTENT-VENDOR',
        },
      });

      await signIn(page, managerEmail, PASSWORD);
      await page.goto(`/dashboard/vendors/${vendor.id}/edit`);

      await page.getByLabel('Vendor name').fill('B'.repeat(101));
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Vendor name must be 100 characters or fewer.')).toBeVisible();

      const afterLongName = await prisma.vendor.findUniqueOrThrow({ where: { id: vendor.id } });
      expect(afterLongName.name).toBe('Persistent Vendor');
      expect(afterLongName.code).toBe('PERSISTENT-VENDOR');

      await page.getByLabel('Vendor name').fill('   ');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Vendor name is required.')).toBeVisible();

      const afterBlankName = await prisma.vendor.findUniqueOrThrow({ where: { id: vendor.id } });
      expect(afterBlankName.name).toBe('Persistent Vendor');
      expect(afterBlankName.code).toBe('PERSISTENT-VENDOR');
    } finally {
      await cleanupFixture(ownerEmail, managerEmail);
    }
  });
});
