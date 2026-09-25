'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';
import { productSchema } from '@/lib/schemas/ProductSchema';

export type ProductActionState = { error?: string };

function canManageProducts(role: string | null | undefined) {
  return role === 'CLIENT_ADMIN' || role === 'MANAGER';
}

async function requireProductManager() {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership || !canManageProducts(activeMembership.role)) return null;
  return activeMembership;
}

function optional(value: string | undefined) {
  return value?.trim() || null;
}

async function parseProductForm(formData: FormData, businessId: string) {
  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description'),
    unitOfMeasure: formData.get('unitOfMeasure'),
    vendorId: formData.get('vendorId'),
    vendorSku: formData.get('vendorSku'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid product.' } as const;

  const vendorId = parsed.data.vendorId && parsed.data.vendorId !== 'none' ? parsed.data.vendorId : null;
  if (vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, businessId }, select: { id: true } });
    if (!vendor) return { error: 'Selected vendor is not available for this business.' } as const;
  }

  return {
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku,
      description: optional(parsed.data.description),
      unitOfMeasure: parsed.data.unitOfMeasure,
      vendorId,
      vendorSku: optional(parsed.data.vendorSku),
    },
  } as const;
}

export async function createProduct(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const membership = await requireProductManager();
  if (!membership) return { error: 'You do not have permission to add products.' };

  const parsed = await parseProductForm(formData, membership.businessId);
  if ('error' in parsed) return { error: parsed.error };

  const duplicate = await prisma.product.findUnique({
    where: { businessId_sku: { businessId: membership.businessId, sku: parsed.data.sku } },
    select: { id: true },
  });
  if (duplicate) return { error: 'A product with this SKU already exists.' };

  const product = await prisma.product.create({ data: { businessId: membership.businessId, ...parsed.data } });
  if (parsed.data.vendorId) {
    await prisma.productVendor.create({ data: { productId: product.id, vendorId: parsed.data.vendorId, vendorSku: parsed.data.vendorSku, preferred: true } });
  }
  revalidatePath('/dashboard/products');
  redirect(`/dashboard/products/${product.id}`);
}

export async function updateProduct(productId: string, _state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const membership = await requireProductManager();
  if (!membership) return { error: 'You do not have permission to edit products.' };

  const parsed = await parseProductForm(formData, membership.businessId);
  if ('error' in parsed) return { error: parsed.error };

  const duplicate = await prisma.product.findFirst({
    where: { businessId: membership.businessId, sku: parsed.data.sku, NOT: { id: productId } },
    select: { id: true },
  });
  if (duplicate) return { error: 'A product with this SKU already exists.' };

  const product = await prisma.product.findFirst({ where: { id: productId, businessId: membership.businessId }, select: { id: true } });
  if (!product) return { error: 'Product not found.' };

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: parsed.data });
    await tx.productVendor.updateMany({ where: { productId }, data: { preferred: false } });
    if (parsed.data.vendorId) {
      await tx.productVendor.upsert({
        where: { productId_vendorId: { productId, vendorId: parsed.data.vendorId } },
        create: { productId, vendorId: parsed.data.vendorId, vendorSku: parsed.data.vendorSku, preferred: true },
        update: { vendorSku: parsed.data.vendorSku, preferred: true },
      });
    }
  });

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);
  redirect(`/dashboard/products/${productId}`);
}

export async function setProductStatus(productId: string, status: 'ACTIVE' | 'INACTIVE') {
  const membership = await requireProductManager();
  if (!membership) return;
  await prisma.product.updateMany({ where: { id: productId, businessId: membership.businessId }, data: { status } });
  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);
}

export async function addProductVendor(productId: string, _state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const membership = await requireProductManager();
  if (!membership) return { error: 'You do not have permission to manage product vendors.' };

  const vendorId = String(formData.get('sourceVendorId') ?? '').trim();
  const vendorSku = optional(String(formData.get('sourceVendorSku') ?? ''));
  const preferred = formData.get('preferred') === 'on' || formData.get('preferred') === 'true';
  if (!vendorId || vendorId === 'none') return { error: 'Select a vendor.' };
  if (vendorSku && vendorSku.length > 80) return { error: 'Vendor SKU must be 80 characters or fewer.' };

  const [product, vendor] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, businessId: membership.businessId }, select: { id: true } }),
    prisma.vendor.findFirst({ where: { id: vendorId, businessId: membership.businessId, status: 'ACTIVE' }, select: { id: true } }),
  ]);
  if (!product) return { error: 'Product not found.' };
  if (!vendor) return { error: 'Selected vendor is not available for this business.' };

  const existing = await prisma.productVendor.findUnique({ where: { productId_vendorId: { productId, vendorId } }, select: { id: true } });
  if (existing) return { error: 'This vendor is already a source for the product.' };

  await prisma.$transaction(async (tx) => {
    if (preferred) {
      await tx.productVendor.updateMany({ where: { productId }, data: { preferred: false } });
      await tx.product.update({ where: { id: productId }, data: { vendorId, vendorSku } });
    }
    await tx.productVendor.create({ data: { productId, vendorId, vendorSku, preferred } });
  });

  revalidatePath(`/dashboard/products/${productId}`);
  redirect(`/dashboard/products/${productId}`);
}

export async function setPreferredProductVendor(productId: string, sourceId: string) {
  const membership = await requireProductManager();
  if (!membership) return;
  const source = await prisma.productVendor.findFirst({
    where: { id: sourceId, productId, product: { businessId: membership.businessId } },
    select: { id: true, vendorId: true, vendorSku: true },
  });
  if (!source) return;
  await prisma.$transaction([
    prisma.productVendor.updateMany({ where: { productId }, data: { preferred: false } }),
    prisma.productVendor.update({ where: { id: source.id }, data: { preferred: true } }),
    prisma.product.update({ where: { id: productId }, data: { vendorId: source.vendorId, vendorSku: source.vendorSku } }),
  ]);
  revalidatePath(`/dashboard/products/${productId}`);
}

export async function removeProductVendor(productId: string, sourceId: string) {
  const membership = await requireProductManager();
  if (!membership) return;
  const source = await prisma.productVendor.findFirst({
    where: { id: sourceId, productId, product: { businessId: membership.businessId } },
    select: { id: true, preferred: true },
  });
  if (!source) return;
  await prisma.$transaction(async (tx) => {
    await tx.productVendor.delete({ where: { id: source.id } });
    if (source.preferred) await tx.product.update({ where: { id: productId }, data: { vendorId: null, vendorSku: null } });
  });
  revalidatePath(`/dashboard/products/${productId}`);
}
