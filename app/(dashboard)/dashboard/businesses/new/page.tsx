import { notFound, redirect } from 'next/navigation';

import CreateBusinessForm from '@/components/businesses/CreateBusinessForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { canManageBusinesses, requireOrganizationMembership } from '@/lib/businesses/access';

const NewBusinessPage = async () => {
  const { membership } = await requireOrganizationMembership();

  if (!membership) redirect('/dashboard/businesses');
  if (!canManageBusinesses(membership.role)) notFound();

  return (
    <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'>
      <Card>
        <CardHeader>
          <CardTitle>Add client business</CardTitle>
          <CardDescription>
            Create a separate tenant for a business managed by {membership.organization.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBusinessForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewBusinessPage;
