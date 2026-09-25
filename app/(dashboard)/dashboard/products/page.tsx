import { CirclePlus, Package } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

export default async function ProductsPage() {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');
  const products = await prisma.product.findMany({ where: { businessId: activeMembership.businessId }, include: { vendor: true }, orderBy: [{ status: 'asc' }, { name: 'asc' }] });
  const canManage = activeMembership.role === 'CLIENT_ADMIN' || activeMembership.role === 'MANAGER';

  return <div className='mx-auto w-full max-w-5xl space-y-6 p-5 sm:p-8'>
    <div className='flex items-start justify-between gap-4'><div><h1 className='text-2xl font-semibold'>Products</h1><p className='text-muted-foreground mt-1 text-sm'>Manage the product catalog for {activeMembership.business.name}.</p></div>
      {canManage && <Button nativeButton={false} render={<Link href='/dashboard/products/new' />}><CirclePlus aria-hidden='true' /> Add product</Button>}
    </div>
    {products.length === 0 ? <Card><CardContent className='flex flex-col items-center gap-3 py-12 text-center'><Package className='text-muted-foreground size-8' aria-hidden='true' /><div><p className='font-medium'>No products yet</p><p className='text-muted-foreground text-sm'>Add your first product to begin building this business&apos;s catalog.</p></div></CardContent></Card> :
      <div className='grid gap-4 sm:grid-cols-2'>{products.map((product) => <Card key={product.id}><CardHeader><div className='flex items-start justify-between gap-3'><div><CardTitle>{product.name}</CardTitle><CardDescription>SKU: {product.sku}</CardDescription></div><Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>{product.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></div></CardHeader><CardContent className='space-y-3'>{product.vendor && <p className='text-muted-foreground text-sm'>Vendor: {product.vendor.name}</p>}<Button variant='outline' nativeButton={false} render={<Link href={`/dashboard/products/${product.id}`} />}>View product</Button></CardContent></Card>)}</div>}
  </div>;
}
