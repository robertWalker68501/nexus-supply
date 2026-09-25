'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';

import type { VendorActionState } from '@/app/(dashboard)/dashboard/vendors/actions';
import { FormFieldControl } from '@/components/form-fields/FormFieldControl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type VendorFormValues = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
};

type VendorFormProps = {
  action: (state: VendorActionState, formData: FormData) => Promise<VendorActionState>;
  defaultValues?: Partial<VendorFormValues>;
  submitLabel: string;
  cancelHref?: string;
};

export default function VendorForm({ action, defaultValues, submitLabel, cancelHref = '/dashboard/vendors' }: VendorFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const form = useForm<VendorFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      contactName: defaultValues?.contactName ?? '',
      contactEmail: defaultValues?.contactEmail ?? '',
      contactPhone: defaultValues?.contactPhone ?? '',
      addressLine1: defaultValues?.addressLine1 ?? '',
      addressLine2: defaultValues?.addressLine2 ?? '',
      city: defaultValues?.city ?? '',
      stateProvince: defaultValues?.stateProvince ?? '',
      postalCode: defaultValues?.postalCode ?? '',
      country: defaultValues?.country ?? '',
    },
  });

  return (
    <form action={formAction} className='space-y-6'>
      {state.error && (
        <Alert variant='destructive'>
          <AlertTitle>Could not save vendor</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <FormFieldControl control={form.control} name='name' label='Vendor name' type='text' required />

      <div className='space-y-4'>
        <div>
          <h3 className='font-medium'>Primary contact</h3>
          <p className='text-muted-foreground text-sm'>Optional purchasing or account contact information.</p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormFieldControl control={form.control} name='contactName' label='Contact name' type='text' autoComplete='name' />
          <FormFieldControl control={form.control} name='contactEmail' label='Contact email' type='email' autoComplete='email' />
          <FormFieldControl control={form.control} name='contactPhone' label='Contact phone' type='tel' autoComplete='tel' className='sm:col-span-2' />
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <h3 className='font-medium'>Vendor address</h3>
          <p className='text-muted-foreground text-sm'>Optional primary business or ordering address.</p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormFieldControl control={form.control} name='addressLine1' label='Address line 1' type='text' autoComplete='address-line1' className='sm:col-span-2' />
          <FormFieldControl control={form.control} name='addressLine2' label='Address line 2' type='text' autoComplete='address-line2' className='sm:col-span-2' />
          <FormFieldControl control={form.control} name='city' label='City' type='text' autoComplete='address-level2' />
          <FormFieldControl control={form.control} name='stateProvince' label='State / province' type='text' autoComplete='address-level1' />
          <FormFieldControl control={form.control} name='postalCode' label='Postal code' type='text' autoComplete='postal-code' />
          <FormFieldControl control={form.control} name='country' label='Country' type='text' autoComplete='country-name' />
        </div>
      </div>

      <div className='flex gap-3'>
        <Button type='submit' disabled={pending}>{pending ? 'Saving…' : submitLabel}</Button>
        <Button variant='outline' nativeButton={false} render={<Link href={cancelHref} />}>Cancel</Button>
      </div>
    </form>
  );
}
