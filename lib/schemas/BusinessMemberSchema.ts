import * as z from 'zod';

export const businessRoles = [
  'CLIENT_ADMIN',
  'MANAGER',
  'RECEIVING',
  'SHIPPING',
  'CUSTOMER_SERVICE',
  'VIEWER',
] as const;

export const addBusinessMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: z.enum(businessRoles),
});


export const updateBusinessMemberRoleSchema = z.object({
  role: z.enum(businessRoles),
});
