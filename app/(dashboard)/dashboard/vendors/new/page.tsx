import { notFound, redirect } from 'next/navigation';

import { createVendor } from '@/app/(dashboard)/dashboard/vendors/actions';
import VendorForm from '@/components/vendors/VendorForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusinessContext } from '@/lib/businesses/context';

export default async function NewVendorPage() {
  const { activeMembership } = await getBusinessContext();
  if (!activeMembership) redirect('/dashboard');
  if (activeMembership.role !== 'CLIENT_ADMIN' && activeMembership.role !== 'MANAGER') notFound();

  return (
    <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'>
      <Card>
        <CardHeader>
          <CardTitle>Add vendor</CardTitle>
          <CardDescription>Create a vendor for {activeMembership.business.name}.</CardDescription>
        </CardHeader>
        <CardContent><VendorForm action={createVendor} submitLabel='Add vendor' /></CardContent>
      </Card>
    </div>
  );
}
