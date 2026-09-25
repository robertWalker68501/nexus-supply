'use client';

import { useActionState } from 'react';

import {
  assignInitialClientAdmin,
  type ClientAdminActionState,
} from '@/app/(dashboard)/dashboard/businesses/client-admin-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: ClientAdminActionState = {};

const AssignInitialClientAdminForm = ({ businessId }: { businessId: string }) => {
  const action = assignInitialClientAdmin.bind(null, businessId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className='space-y-3'>
      {state.error && (
        <Alert variant='destructive'>
          <AlertTitle>Could not assign client administrator</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertTitle>Client administrator assigned</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}
      <div className='space-y-2'>
        <Label htmlFor={`client-admin-${businessId}`}>Client administrator email</Label>
        <Input
          id={`client-admin-${businessId}`}
          name='email'
          type='email'
          placeholder='admin@client.com'
          autoComplete='email'
          required
        />
      </div>
      <Button type='submit' size='sm' disabled={pending}>
        {pending ? 'Assigning…' : 'Assign client administrator'}
      </Button>
    </form>
  );
};

export default AssignInitialClientAdminForm;
