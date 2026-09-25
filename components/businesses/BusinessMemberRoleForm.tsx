'use client';

import { useActionState } from 'react';

import {
  updateBusinessMemberRole,
  type BusinessMemberActionState,
} from '@/app/(dashboard)/dashboard/businesses/[businessId]/members/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

type BusinessRole =
  | 'CLIENT_ADMIN'
  | 'MANAGER'
  | 'RECEIVING'
  | 'SHIPPING'
  | 'CUSTOMER_SERVICE'
  | 'VIEWER';

const initialState: BusinessMemberActionState = {};

const BusinessMemberRoleForm = ({
  businessId,
  membershipId,
  memberName,
  role,
}: {
  businessId: string;
  membershipId: string;
  memberName: string;
  role: BusinessRole;
}) => {
  const action = updateBusinessMemberRole.bind(null, businessId, membershipId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className='space-y-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <label className='sr-only' htmlFor={`role-${membershipId}`}>
          Role for {memberName}
        </label>
        <NativeSelect
          id={`role-${membershipId}`}
          name='role'
          defaultValue={role}
          aria-label={`Role for ${memberName}`}
          className='min-w-44'
        >
          <NativeSelectOption value='CLIENT_ADMIN'>Client administrator</NativeSelectOption>
          <NativeSelectOption value='MANAGER'>Manager</NativeSelectOption>
          <NativeSelectOption value='RECEIVING'>Receiving</NativeSelectOption>
          <NativeSelectOption value='SHIPPING'>Shipping</NativeSelectOption>
          <NativeSelectOption value='CUSTOMER_SERVICE'>Customer service</NativeSelectOption>
          <NativeSelectOption value='VIEWER'>Viewer</NativeSelectOption>
        </NativeSelect>
        <Button type='submit' size='sm' variant='outline' disabled={pending}>
          {pending ? 'Saving…' : 'Save role'}
        </Button>
      </div>
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
    </form>
  );
};

export default BusinessMemberRoleForm;
