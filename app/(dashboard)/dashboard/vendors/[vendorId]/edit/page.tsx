import { notFound, redirect } from 'next/navigation';

import { updateVendor } from '@/app/(dashboard)/dashboard/vendors/actions';
import VendorForm from '@/components/vendors/VendorForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';
import prisma from '@/lib/prisma';

type Props = { params: Promise<{ vendorId: string }> };

export default async function EditVendorPage({ params }: Props) {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');
  if (activeMembership.role !== 'CLIENT_ADMIN' && activeMembership.role !== 'MANAGER') notFound();

  const { vendorId } = await params;
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, businessId: activeMembership.businessId },
  });
  if (!vendor) notFound();

  const updateAction = updateVendor.bind(null, vendor.id);

  return (
    <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'>
      <Card>
        <CardHeader>
          <CardTitle>Edit vendor</CardTitle>
          <CardDescription>
            Update {vendor.name}. The vendor code {vendor.code} remains stable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorForm
            action={updateAction}
            defaultValues={{
              name: vendor.name,
              contactName: vendor.contactName ?? '',
              contactEmail: vendor.contactEmail ?? '',
              contactPhone: vendor.contactPhone ?? '',
              addressLine1: vendor.addressLine1 ?? '',
              addressLine2: vendor.addressLine2 ?? '',
              city: vendor.city ?? '',
              stateProvince: vendor.stateProvince ?? '',
              postalCode: vendor.postalCode ?? '',
              country: vendor.country ?? '',
            }}
            submitLabel='Save changes'
            cancelHref={`/dashboard/vendors/${vendor.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
