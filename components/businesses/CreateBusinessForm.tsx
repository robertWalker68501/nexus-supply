'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { createBusiness } from '@/app/(dashboard)/dashboard/businesses/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CreateBusinessForm = () => {
  const [state, action, pending] = useActionState(createBusiness, {});

  return (
    <form action={action} className='space-y-5'>
      {state.error && (
        <Alert variant='destructive'>
          <AlertTitle>Could not add business</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className='space-y-2'>
        <Label htmlFor='name'>Business name</Label>
        <Input
          id='name'
          name='name'
          placeholder='Northstar Retail'
          maxLength={100}
          required
          autoFocus
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='clientAdminEmail'>Initial client administrator</Label>
        <Input
          id='clientAdminEmail'
          name='clientAdminEmail'
          type='email'
          placeholder='admin@client.com'
          autoComplete='email'
        />
        <p className='text-muted-foreground text-sm'>
          Optional. The user must already have a NexusSupply account. You can assign
          the initial client administrator later if needed.
        </p>
      </div>
      <div className='flex gap-3'>
        <Button type='submit' disabled={pending}>
          {pending ? 'Adding…' : 'Add business'}
        </Button>
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link href='/dashboard/businesses' />}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CreateBusinessForm;
