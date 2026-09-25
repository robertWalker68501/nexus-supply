'use client';

import { removeProductVendor } from '@/app/(dashboard)/dashboard/products/actions';
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

export default function RemoveProductVendorButton({
  productId,
  sourceId,
  vendorName,
  preferred,
}: {
  productId: string;
  sourceId: string;
  vendorName: string;
  preferred: boolean;
}) {
  const action = removeProductVendor.bind(null, productId, sourceId);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label={`Remove ${vendorName}`}
          />
        }
      >
        Remove
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {vendorName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {preferred
              ? 'This vendor is currently preferred. Removing it will also clear the product’s primary vendor and vendor SKU.'
              : 'This removes the vendor as a source for this product. The product and vendor records will not be deleted.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={action}>
            <AlertDialogAction type='submit' variant='destructive'>
              Remove vendor
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
