'use client';

import { useActionState } from 'react';

import { createOrganization } from '@/app/(dashboard)/dashboard/businesses/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OrganizationSetupForm = () => {
  const [state, action, pending] = useActionState(createOrganization, {});

  return (
    <form action={action} className='space-y-5'>
      {state.error && (
        <Alert variant='destructive'>
          <AlertTitle>Could not create workspace</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className='space-y-2'>
        <Label htmlFor='name'>Workspace name</Label>
        <Input
          id='name'
          name='name'
          placeholder='Acme Supply Operations'
          maxLength={100}
          required
          autoFocus
        />
        <p className='text-muted-foreground text-sm'>
          Usually the name of the company operating NexusSupply for its clients.
        </p>
      </div>
      <Button type='submit' disabled={pending}>
        {pending ? 'Creating…' : 'Create workspace'}
      </Button>
    </form>
  );
};

export default OrganizationSetupForm;
