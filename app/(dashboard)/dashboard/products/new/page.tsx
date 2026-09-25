import { notFound, redirect } from 'next/navigation';

import { createProduct } from '@/app/(dashboard)/dashboard/products/actions';
import ProductForm from '@/components/products/ProductForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

export default async function NewProductPage() {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');
  if (activeMembership.role !== 'CLIENT_ADMIN' && activeMembership.role !== 'MANAGER') notFound();
  const vendors = await prisma.vendor.findMany({ where: { businessId: activeMembership.businessId, status: 'ACTIVE' }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } });
  return <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'><Card><CardHeader><CardTitle>Add product</CardTitle><CardDescription>Create a product for {activeMembership.business.name}.</CardDescription></CardHeader><CardContent><ProductForm action={createProduct} vendors={vendors} submitLabel='Add product' /></CardContent></Card></div>;
}
