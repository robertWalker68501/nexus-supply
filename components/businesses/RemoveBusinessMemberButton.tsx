'use client';

import { useActionState } from 'react';
import { UserMinus } from 'lucide-react';

import {
  removeBusinessMember,
  type BusinessMemberActionState,
} from '@/app/(dashboard)/dashboard/businesses/[businessId]/members/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const initialState: BusinessMemberActionState = {};

const RemoveBusinessMemberButton = ({
  businessId,
  membershipId,
  memberName,
}: {
  businessId: string;
  membershipId: string;
  memberName: string;
}) => {
  const action = removeBusinessMember.bind(null, businessId, membershipId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className='space-y-2'>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type='button'
              size='sm'
              variant='ghost'
              aria-label={`Remove ${memberName}`}
            />
          }
        >
          <UserMinus aria-hidden='true' />
          Remove
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This immediately revokes this user's access to the client business.
              Memberships in other client businesses are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={formAction}>
              <AlertDialogAction
                type='submit'
                variant='destructive'
                disabled={pending}
              >
                {pending ? 'Removing…' : 'Remove member'}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {state.error && (
        <Alert variant='destructive'>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <p className='text-muted-foreground text-sm' role='status'>
          {state.success}
        </p>
      )}
    </div>
  );
};

export default RemoveBusinessMemberButton;
