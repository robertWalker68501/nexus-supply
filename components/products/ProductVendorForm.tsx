'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';

import type { ProductActionState } from '@/app/(dashboard)/dashboard/products/actions';
import { FormFieldControl } from '@/components/form-fields/FormFieldControl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type Values = { sourceVendorId: string; sourceVendorSku: string; preferred: boolean };
type Props = { action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>; vendors: { id: string; name: string; code: string }[] };

export default function ProductVendorForm({ action, vendors }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const form = useForm<Values>({ defaultValues: { sourceVendorId: 'none', sourceVendorSku: '', preferred: false } });
  return <form action={formAction} className='space-y-4'>
    {state.error && <Alert variant='destructive'><AlertTitle>Could not add vendor</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
    <FormFieldControl control={form.control} name='sourceVendorId' label='Vendor' type='select' options={[{ label: 'Select a vendor', value: 'none' }, ...vendors.map(v => ({ label: `${v.name} (${v.code})`, value: v.id }))]} />
    <FormFieldControl control={form.control} name='sourceVendorSku' label='Vendor SKU' type='text' description='The vendor’s identifier for this product.' />
    <FormFieldControl control={form.control} name='preferred' label='Preferred vendor' type='checkbox' checkboxLabel='Make this the preferred vendor' description='The preferred vendor is also shown as the product’s primary vendor.' />
    <Button type='submit' disabled={pending}>{pending ? 'Adding…' : 'Add vendor'}</Button>
  </form>;
}
