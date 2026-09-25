import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { addProductVendor, removeProductVendor, setPreferredProductVendor, setProductStatus } from '@/app/(dashboard)/dashboard/products/actions';
import ProductVendorForm from '@/components/products/ProductVendorForm';
import RemoveProductVendorButton from '@/components/products/RemoveProductVendorButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

type Props = { params: Promise<{ productId: string }> };
export default async function ProductPage({ params }: Props) {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');
  const { productId } = await params;
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: activeMembership.businessId },
    include: { vendor: true, sources: { include: { vendor: true }, orderBy: [{ preferred: 'desc' }, { vendor: { name: 'asc' } }] } },
  });
  if (!product) notFound();
  const canManage = activeMembership.role === 'CLIENT_ADMIN' || activeMembership.role === 'MANAGER';
  const availableVendors = canManage ? await prisma.vendor.findMany({
    where: { businessId: activeMembership.businessId, status: 'ACTIVE', id: { notIn: product.sources.map(source => source.vendorId) } },
    select: { id: true, name: true, code: true }, orderBy: { name: 'asc' },
  }) : [];
  const toggleAction = setProductStatus.bind(null, product.id, product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
  const addVendorAction = addProductVendor.bind(null, product.id);

  return <div className='mx-auto w-full max-w-2xl space-y-6 p-5 sm:p-8'>
    <Card><CardHeader><div className='flex items-start justify-between gap-3'><div><CardTitle>{product.name}</CardTitle><CardDescription>SKU: {product.sku}</CardDescription></div><Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>{product.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></div></CardHeader>{canManage && <CardContent><Button nativeButton={false} render={<Link href={`/dashboard/products/${product.id}/edit`} />}><Pencil className='size-4' aria-hidden='true' />Edit product</Button></CardContent>}</Card>
    <Card><CardHeader><CardTitle>Product details</CardTitle></CardHeader><CardContent className='grid gap-4 sm:grid-cols-2'><div><p className='text-sm font-medium'>Unit of measure</p><p className='text-muted-foreground text-sm'>{product.unitOfMeasure}</p></div><div><p className='text-sm font-medium'>Primary vendor</p><p className='text-muted-foreground text-sm'>{product.vendor?.name ?? 'No primary vendor'}</p></div><div><p className='text-sm font-medium'>Vendor SKU</p><p className='text-muted-foreground text-sm'>{product.vendorSku ?? '—'}</p></div><div className='sm:col-span-2'><p className='text-sm font-medium'>Description</p><p className='text-muted-foreground whitespace-pre-wrap text-sm'>{product.description ?? 'No description added.'}</p></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Vendor sources</CardTitle><CardDescription>Vendors that can supply this product.</CardDescription></CardHeader><CardContent className='space-y-4'>
      {product.sources.length === 0 ? <p className='text-muted-foreground text-sm'>No vendor sources added.</p> : <div className='space-y-3'>{product.sources.map(source => <div
      key={source.id}
      className='flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between'
      role='group'
      aria-label={`Vendor source ${source.vendor.name}`}
    ><div><div className='flex items-center gap-2'><p className='font-medium'>{source.vendor.name}</p>{source.preferred && <Badge variant='secondary'>Preferred</Badge>}</div><p className='text-muted-foreground text-sm'>Vendor SKU: {source.vendorSku ?? '—'}</p></div>{canManage && <div className='flex gap-2'>{!source.preferred && <form action={setPreferredProductVendor.bind(null, product.id, source.id)}><Button type='submit' variant='outline' size='sm'>Make preferred</Button></form>}<RemoveProductVendorButton productId={product.id} sourceId={source.id} vendorName={source.vendor.name} preferred={source.preferred} /></div>}</div>)}</div>}
      {canManage && availableVendors.length > 0 && <div className='border-t pt-4'><ProductVendorForm action={addVendorAction} vendors={availableVendors} /></div>}
      {canManage && availableVendors.length === 0 && product.sources.length > 0 && <p className='text-muted-foreground text-sm'>All active vendors are already linked to this product.</p>}
    </CardContent></Card>
    {canManage && <Card><CardHeader><CardTitle>{product.status === 'ACTIVE' ? 'Deactivate product' : 'Reactivate product'}</CardTitle><CardDescription>{product.status === 'ACTIVE' ? 'Keep the product record but remove it from active workflows.' : 'Return this product to active workflows.'}</CardDescription></CardHeader><CardContent><form action={toggleAction}><Button type='submit' variant={product.status === 'ACTIVE' ? 'destructive' : 'default'}>{product.status === 'ACTIVE' ? 'Deactivate product' : 'Reactivate product'}</Button></form></CardContent></Card>}
  </div>;
}
