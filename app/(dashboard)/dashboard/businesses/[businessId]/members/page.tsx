import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AddBusinessMemberForm from '@/components/businesses/AddBusinessMemberForm';
import BusinessMemberRoleForm from '@/components/businesses/BusinessMemberRoleForm';
import RemoveBusinessMemberButton from '@/components/businesses/RemoveBusinessMemberButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { canManageBusinessMembers } from '@/lib/businesses/access';
import prisma from '@/lib/prisma';

const roleLabels = {
  CLIENT_ADMIN: 'Client administrator',
  MANAGER: 'Manager',
  RECEIVING: 'Receiving',
  SHIPPING: 'Shipping',
  CUSTOMER_SERVICE: 'Customer service',
  VIEWER: 'Viewer',
} as const;

const BusinessMembersPage = async ({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) => {
  const { businessId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return notFound();
  if (session.user.role) return notFound();

  const administratorMembership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
  });

  if (
    !administratorMembership ||
    !canManageBusinessMembers(administratorMembership.role)
  ) {
    return notFound();
  }

  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
    },
    include: {
      organization: { select: { name: true } },
      members: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ user: { name: 'asc' } }, { createdAt: 'asc' }],
      },
    },
  });

  if (!business) notFound();

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-5 sm:p-8'>
      <header className='space-y-4'>
        <Button
          variant='ghost'
          nativeButton={false}
          render={<Link href='/dashboard/businesses' />}
        >
          <ArrowLeft aria-hidden='true' />
          Client businesses
        </Button>

        <div>
          <p className='text-primary text-sm font-semibold tracking-wider uppercase'>
            {business.organization.name}
          </p>
          <h1 className='font-heading mt-1 text-3xl font-semibold tracking-tight'>
            {business.name} members
          </h1>
          <p className='text-muted-foreground mt-2'>
            Add or invite users and manage their role for this client business.
          </p>
        </div>
      </header>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
                <Users className='size-5' aria-hidden='true' />
              </div>
              <div>
                <CardTitle>Business members</CardTitle>
                <CardDescription>
                  {business.members.length} {business.members.length === 1 ? 'member' : 'members'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {business.members.length === 0 ? (
              <div className='border-border rounded-lg border border-dashed p-8 text-center'>
                <p className='font-medium'>No members yet</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Add an existing NexusSupply user to this client business.
                </p>
              </div>
            ) : (
              <div className='divide-border divide-y'>
                {business.members.map((member) => (
                  <div
                    key={member.id}
                    className='flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between'
                  >
                    <div className='min-w-0'>
                      <p className='truncate font-medium'>{member.user.name}</p>
                      <p className='text-muted-foreground truncate text-sm'>{member.user.email}</p>
                    </div>
                    {member.userId === session.user.id ? (
                      <div className='flex flex-col items-start gap-1 sm:items-end'>
                        <Badge variant='secondary'>{roleLabels[member.role]}</Badge>
                        <span className='text-muted-foreground text-xs'>Your role</span>
                      </div>
                    ) : (
                      <div className='flex flex-col items-start gap-2 sm:items-end'>
                        <BusinessMemberRoleForm
                          businessId={business.id}
                          membershipId={member.id}
                          memberName={member.user.name}
                          role={member.role}
                        />
                        <RemoveBusinessMemberButton
                          businessId={business.id}
                          membershipId={member.id}
                          memberName={member.user.name}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add member</CardTitle>
            <CardDescription>
              Existing users are added immediately. New users receive an invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddBusinessMemberForm businessId={business.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessMembersPage;
