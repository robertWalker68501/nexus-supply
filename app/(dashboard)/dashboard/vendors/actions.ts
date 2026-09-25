'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import slugify from 'slugify';

import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';
import { vendorSchema, type VendorFormData } from '@/lib/schemas/VendorSchema';

export type VendorActionState = { error?: string };

function canManageVendors(role: string | null | undefined) {
  return role === 'CLIENT_ADMIN' || role === 'MANAGER';
}

async function requireVendorManager() {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership || !canManageVendors(activeMembership.role)) return null;
  return activeMembership;
}

async function uniqueVendorCode(businessId: string, name: string) {
  const base = slugify(name, { lower: false, strict: true }).toUpperCase().slice(0, 24) || 'VENDOR';
  let code = base;
  let suffix = 2;
  while (await prisma.vendor.findUnique({ where: { businessId_code: { businessId, code } } })) {
    const suffixText = `-${suffix++}`;
    code = `${base.slice(0, 24 - suffixText.length)}${suffixText}`;
  }
  return code;
}

function parseVendor(formData: FormData) {
  return vendorSchema.safeParse({
    name: formData.get('name'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone'),
    addressLine1: formData.get('addressLine1'),
    addressLine2: formData.get('addressLine2'),
    city: formData.get('city'),
    stateProvince: formData.get('stateProvince'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country'),
  });
}

function nullable(value: string | undefined) {
  return value?.trim() || null;
}

function vendorDetails(data: VendorFormData) {
  return {
    contactName: nullable(data.contactName),
    contactEmail: nullable(data.contactEmail),
    contactPhone: nullable(data.contactPhone),
    addressLine1: nullable(data.addressLine1),
    addressLine2: nullable(data.addressLine2),
    city: nullable(data.city),
    stateProvince: nullable(data.stateProvince),
    postalCode: nullable(data.postalCode),
    country: nullable(data.country),
  };
}

export async function createVendor(_state: VendorActionState, formData: FormData): Promise<VendorActionState> {
  const membership = await requireVendorManager();
  if (!membership) return { error: 'You do not have permission to add vendors.' };

  const parsed = parseVendor(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid vendor.' };

  const code = await uniqueVendorCode(membership.businessId, parsed.data.name);
  const vendor = await prisma.vendor.create({
    data: { businessId: membership.businessId, name: parsed.data.name, code, ...vendorDetails(parsed.data) },
  });

  revalidatePath('/dashboard/vendors');
  redirect(`/dashboard/vendors/${vendor.id}`);
}

export async function updateVendor(vendorId: string, _state: VendorActionState, formData: FormData): Promise<VendorActionState> {
  const membership = await requireVendorManager();
  if (!membership) return { error: 'You do not have permission to edit vendors.' };

  const parsed = parseVendor(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid vendor.' };

  const result = await prisma.vendor.updateMany({
    where: { id: vendorId, businessId: membership.businessId },
    data: { name: parsed.data.name, ...vendorDetails(parsed.data) },
  });
  if (result.count !== 1) return { error: 'Vendor not found.' };

  revalidatePath('/dashboard/vendors');
  revalidatePath(`/dashboard/vendors/${vendorId}`);
  revalidatePath(`/dashboard/vendors/${vendorId}/edit`);
  redirect(`/dashboard/vendors/${vendorId}`);
}

export async function setVendorStatus(vendorId: string, status: 'ACTIVE' | 'INACTIVE') {
  const membership = await requireVendorManager();
  if (!membership) return;
  await prisma.vendor.updateMany({ where: { id: vendorId, businessId: membership.businessId }, data: { status } });
  revalidatePath('/dashboard/vendors');
  revalidatePath(`/dashboard/vendors/${vendorId}`);
}
