import { Mail, MapPin, Pencil, Phone, UserRound } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { setVendorStatus } from '@/app/(dashboard)/dashboard/vendors/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

type Props = { params: Promise<{ vendorId: string }> };

export default async function VendorPage({ params }: Props) {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');

  const { vendorId } = await params;
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, businessId: activeMembership.businessId },
  });
  if (!vendor) notFound();

  const canManage = activeMembership.role === 'CLIENT_ADMIN' || activeMembership.role === 'MANAGER';
  const toggleAction = setVendorStatus.bind(null, vendor.id, vendor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
  const hasContact = vendor.contactName || vendor.contactEmail || vendor.contactPhone;
  const hasAddress = vendor.addressLine1 || vendor.addressLine2 || vendor.city || vendor.stateProvince || vendor.postalCode || vendor.country;
  const cityState = [vendor.city, vendor.stateProvince].filter(Boolean).join(', ');
  const locality = [cityState, vendor.postalCode].filter(Boolean).join(' ');

  return (
    <div className='mx-auto w-full max-w-2xl space-y-6 p-5 sm:p-8'>
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <CardTitle>{vendor.name}</CardTitle>
              <CardDescription>Vendor code: {vendor.code}</CardDescription>
            </div>
            <Badge variant={vendor.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {vendor.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        {canManage && (
          <CardContent>
            <Button nativeButton={false} render={<Link href={`/dashboard/vendors/${vendor.id}/edit`} />}>
              <Pencil className='size-4' aria-hidden='true' />
              Edit vendor
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & address</CardTitle>
          <CardDescription>Primary vendor contact and business address.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-5 sm:grid-cols-2'>
          <div className='space-y-2'>
            <p className='font-medium'>Primary contact</p>
            {hasContact ? (
              <div className='text-muted-foreground space-y-2 text-sm'>
                {vendor.contactName && <p className='flex items-center gap-2'><UserRound className='size-4' aria-hidden='true' />{vendor.contactName}</p>}
                {vendor.contactEmail && <p className='flex items-center gap-2'><Mail className='size-4' aria-hidden='true' />{vendor.contactEmail}</p>}
                {vendor.contactPhone && <p className='flex items-center gap-2'><Phone className='size-4' aria-hidden='true' />{vendor.contactPhone}</p>}
              </div>
            ) : <p className='text-muted-foreground text-sm'>No contact information added.</p>}
          </div>
          <div className='space-y-2'>
            <p className='font-medium'>Vendor address</p>
            {hasAddress ? (
              <address className='text-muted-foreground flex gap-2 text-sm not-italic'>
                <MapPin className='mt-0.5 size-4 shrink-0' aria-hidden='true' />
                <span>
                  {vendor.addressLine1 && <span className='block'>{vendor.addressLine1}</span>}
                  {vendor.addressLine2 && <span className='block'>{vendor.addressLine2}</span>}
                  {locality && <span className='block'>{locality}</span>}
                  {vendor.country && <span className='block'>{vendor.country}</span>}
                </span>
              </address>
            ) : <p className='text-muted-foreground text-sm'>No address added.</p>}
          </div>
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>{vendor.status === 'ACTIVE' ? 'Deactivate vendor' : 'Reactivate vendor'}</CardTitle>
            <CardDescription>
              {vendor.status === 'ACTIVE' ? 'Keep the vendor record but remove it from active workflows.' : 'Return this vendor to active workflows.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={toggleAction}>
              <Button type='submit' variant={vendor.status === 'ACTIVE' ? 'destructive' : 'default'}>
                {vendor.status === 'ACTIVE' ? 'Deactivate vendor' : 'Reactivate vendor'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
