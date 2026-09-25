import { notFound, redirect } from 'next/navigation';

import { updateProduct } from '@/app/(dashboard)/dashboard/products/actions';
import ProductForm from '@/components/products/ProductForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

type Props = { params: Promise<{ productId: string }> };
export default async function EditProductPage({ params }: Props) {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');
  if (activeMembership.role !== 'CLIENT_ADMIN' && activeMembership.role !== 'MANAGER') notFound();
  const { productId } = await params;
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: activeMembership.businessId } });
  if (!product) notFound();
  const vendors = await prisma.vendor.findMany({ where: { businessId: activeMembership.businessId, ...(product.vendorId ? { OR: [{ status: 'ACTIVE' }, { id: product.vendorId }] } : { status: 'ACTIVE' }) }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } });
  const action = updateProduct.bind(null, product.id);
  return <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'><Card><CardHeader><CardTitle>Edit product</CardTitle><CardDescription>Update product details for {activeMembership.business.name}.</CardDescription></CardHeader><CardContent><ProductForm action={action} vendors={vendors} submitLabel='Save changes' cancelHref={`/dashboard/products/${product.id}`} defaultValues={{ name: product.name, sku: product.sku, description: product.description ?? '', unitOfMeasure: product.unitOfMeasure, vendorId: product.vendorId ?? 'none', vendorSku: product.vendorSku ?? '' }} /></CardContent></Card></div>;
}
