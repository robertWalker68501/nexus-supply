import { Building2, CirclePlus } from 'lucide-react';
import Link from 'next/link';

import AssignInitialClientAdminForm from '@/components/businesses/AssignInitialClientAdminForm';
import OrganizationSetupForm from '@/components/businesses/OrganizationSetupForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { canCreateOrganization, canManageBusinesses, requireOrganizationMembership } from '@/lib/businesses/access';
import prisma from '@/lib/prisma';

const BusinessesPage = async () => {
  const { session, membership } = await requireOrganizationMembership();

  if (!membership) {
    if (!canCreateOrganization(session.user.role)) {
      return (
        <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'>
          <Card>
            <CardHeader>
              <CardTitle>No workspace access</CardTitle>
              <CardDescription>
                Your account has not been assigned to a NexusSupply workspace or client business yet.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'>
        <Card>
          <CardHeader>
            <CardTitle>Create your NexusSupply workspace</CardTitle>
            <CardDescription>
              Create the operating company that will manage one or more client businesses.
            </CardDescription>
          </CardHeader>
          <CardContent><OrganizationSetupForm /></CardContent>
        </Card>
      </div>
    );
  }

  const businesses = await prisma.business.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      members: {
        where: { role: 'CLIENT_ADMIN' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      invitations: {
        where: { role: 'CLIENT_ADMIN', status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });
  const canManage = canManageBusinesses(membership.role);

  return (
    <div className='mx-auto w-full max-w-7xl space-y-6 p-5 sm:p-8'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-primary text-sm font-semibold tracking-wider uppercase'>{membership.organization.name}</p>
          <h1 className='font-heading mt-1 text-3xl font-semibold tracking-tight'>Client businesses</h1>
          <p className='text-muted-foreground mt-2 max-w-2xl'>Manage the client businesses contained within this operating workspace.</p>
        </div>
        {canManage && <Button nativeButton={false} render={<Link href='/dashboard/businesses/new' />}><CirclePlus aria-hidden='true' />Add business</Button>}
      </header>

      {businesses.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center py-12 text-center'>
            <div className='bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-xl'><Building2 aria-hidden='true' /></div>
            <h2 className='font-heading text-xl font-semibold'>No client businesses yet</h2>
            <p className='text-muted-foreground mt-2 max-w-md text-sm'>Add the first business whose supply chain your organization will manage.</p>
            {canManage && <Button className='mt-5' nativeButton={false} render={<Link href='/dashboard/businesses/new' />}>Add first business</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {businesses.map((business) => (
            <Card key={business.id}>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'><Building2 className='size-5' aria-hidden='true' /></div>
                  <Badge variant={business.status === 'ACTIVE' ? 'secondary' : 'outline'}>{business.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge>
                </div>
                <CardTitle className='mt-3'>{business.name}</CardTitle>
                <CardDescription>{business.code ? `Code: ${business.code}` : 'No business code assigned'}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-muted-foreground text-sm'>
                  Tenant ID: <span className='font-mono'>{business.slug}</span>
                </p>
                {business.members[0] ? (
                  <div className='rounded-lg border p-3'>
                    <p className='text-sm font-medium'>Client administrator</p>
                    <p className='mt-1 text-sm'>{business.members[0].user.name}</p>
                    <p className='text-muted-foreground text-sm'>
                      {business.members[0].user.email}
                    </p>
                  </div>
                ) : business.invitations[0] ? (
                  <div className='rounded-lg border p-3'>
                    <p className='text-sm font-medium'>Client administrator invitation pending</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {business.invitations[0].email}
                    </p>
                  </div>
                ) : canManage ? (
                  <div className='rounded-lg border border-dashed p-3'>
                    <p className='mb-3 text-sm font-medium'>
                      No client administrator assigned
                    </p>
                    <AssignInitialClientAdminForm businessId={business.id} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessesPage;
