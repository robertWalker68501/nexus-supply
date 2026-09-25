'use client';

import { useActionState } from 'react';

import {
  addBusinessMember,
  type BusinessMemberActionState,
} from '@/app/(dashboard)/dashboard/businesses/[businessId]/members/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

const initialState: BusinessMemberActionState = {};

const AddBusinessMemberForm = ({ businessId }: { businessId: string }) => {
  const action = addBusinessMember.bind(null, businessId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className='space-y-5'>
      {state.error && (
        <Alert variant='destructive'>
          <AlertTitle>Could not add member</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert>
          <AlertTitle>Member added</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-2'>
        <Label htmlFor='email'>User email</Label>
        <Input
          id='email'
          name='email'
          type='email'
          placeholder='user@example.com'
          autoComplete='email'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='role'>Business role</Label>
        <NativeSelect id='role' name='role' defaultValue='VIEWER' required>
          <NativeSelectOption value='CLIENT_ADMIN'>Client administrator</NativeSelectOption>
          <NativeSelectOption value='MANAGER'>Manager</NativeSelectOption>
          <NativeSelectOption value='RECEIVING'>Receiving</NativeSelectOption>
          <NativeSelectOption value='SHIPPING'>Shipping</NativeSelectOption>
          <NativeSelectOption value='CUSTOMER_SERVICE'>Customer service</NativeSelectOption>
          <NativeSelectOption value='VIEWER'>Viewer</NativeSelectOption>
        </NativeSelect>
      </div>

      <Button type='submit' disabled={pending}>
        {pending ? 'Adding…' : 'Add member'}
      </Button>
    </form>
  );
};

export default AddBusinessMemberForm;
