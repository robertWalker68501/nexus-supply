'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';

import type { ProductActionState } from '@/app/(dashboard)/dashboard/products/actions';
import { FormFieldControl } from '@/components/form-fields/FormFieldControl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type ProductFormValues = {
  name: string;
  sku: string;
  description: string;
  unitOfMeasure: string;
  vendorId: string;
  vendorSku: string;
};

type Props = {
  action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  vendors: { id: string; name: string; code: string }[];
  defaultValues?: Partial<ProductFormValues>;
  submitLabel: string;
  cancelHref?: string;
};

export default function ProductForm({ action, vendors, defaultValues, submitLabel, cancelHref = '/dashboard/products' }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: '', sku: '', description: '', unitOfMeasure: 'Each', vendorId: 'none', vendorSku: '', ...defaultValues,
    },
  });

  return (
    <form action={formAction} className='space-y-5'>
      {state.error && <Alert variant='destructive'><AlertTitle>Could not save product</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
      <div className='grid gap-5 sm:grid-cols-2'>
        <FormFieldControl control={form.control} name='name' label='Product name' type='text' required />
        <FormFieldControl control={form.control} name='sku' label='SKU' type='text' required />
      </div>
      <FormFieldControl control={form.control} name='description' label='Description' type='textarea' rows={4} />
      <div className='grid gap-5 sm:grid-cols-2'>
        <FormFieldControl control={form.control} name='unitOfMeasure' label='Unit of measure' type='text' required description='Examples: Each, Case, Box, Pallet.' />
        <FormFieldControl control={form.control} name='vendorId' label='Primary vendor' type='select' options={[{ label: 'No primary vendor', value: 'none' }, ...vendors.map((vendor) => ({ label: `${vendor.name} (${vendor.code})`, value: vendor.id }))]} />
      </div>
      <FormFieldControl control={form.control} name='vendorSku' label='Vendor SKU' type='text' description='The vendor’s identifier for this product, if different from your SKU.' />
      <div className='flex gap-3'>
        <Button type='submit' disabled={pending}>{pending ? 'Saving…' : submitLabel}</Button>
        <Button variant='outline' nativeButton={false} render={<Link href={cancelHref} />}>Cancel</Button>
      </div>
    </form>
  );
}
