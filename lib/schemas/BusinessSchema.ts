import * as z from 'zod';

const normalizedName = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be 100 characters or fewer');

export const createOrganizationSchema = z.object({
  name: normalizedName,
});

export const createBusinessSchema = z.object({
  name: normalizedName,
  clientAdminEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid client administrator email address')
    .or(z.literal(''))
    .optional(),
});
