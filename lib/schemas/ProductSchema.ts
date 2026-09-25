import { z } from 'zod';

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''));

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.').max(120, 'Product name must be 120 characters or fewer.'),
  sku: z.string().trim().min(1, 'SKU is required.').max(60, 'SKU must be 60 characters or fewer.'),
  description: optionalText(1000, 'Description must be 1000 characters or fewer.'),
  unitOfMeasure: z.string().trim().min(1, 'Unit of measure is required.').max(40, 'Unit of measure must be 40 characters or fewer.'),
  vendorId: z.string().trim().optional().or(z.literal('')),
  vendorSku: optionalText(80, 'Vendor SKU must be 80 characters or fewer.'),
});

export type ProductFormData = z.infer<typeof productSchema>;
