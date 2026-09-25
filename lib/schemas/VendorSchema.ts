import { z } from 'zod';

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''));

const optionalEmail = z
  .string()
  .trim()
  .max(254, 'Contact email must be 254 characters or fewer.')
  .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid contact email address.')
  .optional()
  .or(z.literal(''));

export const vendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required.').max(100, 'Vendor name must be 100 characters or fewer.'),
  contactName: optionalText(100, 'Contact name must be 100 characters or fewer.'),
  contactEmail: optionalEmail,
  contactPhone: optionalText(50, 'Contact phone must be 50 characters or fewer.'),
  addressLine1: optionalText(150, 'Address line 1 must be 150 characters or fewer.'),
  addressLine2: optionalText(150, 'Address line 2 must be 150 characters or fewer.'),
  city: optionalText(100, 'City must be 100 characters or fewer.'),
  stateProvince: optionalText(100, 'State or province must be 100 characters or fewer.'),
  postalCode: optionalText(30, 'Postal code must be 30 characters or fewer.'),
  country: optionalText(100, 'Country must be 100 characters or fewer.'),
});

export const vendorNameSchema = vendorSchema.pick({ name: true });

export type VendorFormData = z.infer<typeof vendorSchema>;
