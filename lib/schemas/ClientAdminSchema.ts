import * as z from 'zod';

export const assignInitialClientAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});
