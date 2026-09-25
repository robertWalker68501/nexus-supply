import { Building2, CirclePlus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

export default async function VendorsPage() {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');

  const vendors = await prisma.vendor.findMany({
    where: { businessId: activeMembership.businessId },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });
  const canManage = activeMembership.role === 'CLIENT_ADMIN' || activeMembership.role === 'MANAGER';

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-5 sm:p-8'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Vendors</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Manage vendors for {activeMembership.business.name}.</p>
        </div>
        {canManage && (
          <Button nativeButton={false} render={<Link href='/dashboard/vendors/new' />}>
            <CirclePlus aria-hidden='true' /> Add vendor
          </Button>
        )}
      </div>

      {vendors.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center gap-3 py-12 text-center'>
            <Building2 className='text-muted-foreground size-8' aria-hidden='true' />
            <div>
              <p className='font-medium'>No vendors yet</p>
              <p className='text-muted-foreground text-sm'>Add your first vendor to begin building this business&apos;s supply network.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <CardTitle>{vendor.name}</CardTitle>
                    <CardDescription>{vendor.code}</CardDescription>
                  </div>
                  <Badge variant={vendor.status === 'ACTIVE' ? 'default' : 'secondary'}>{vendor.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant='outline' nativeButton={false} render={<Link href={`/dashboard/vendors/${vendor.id}`} />}>View vendor</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
