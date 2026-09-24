import * as z from 'zod';

export const createUserAccountSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters' })
      .max(30, { message: 'Name must be at most 30 characters' }),
    email: z.email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(50, { message: 'Password must be at most 50 characters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(50, { message: 'Password must be at most 50 characters' }),
    callbackURL: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const signInUserSchema = z.object({
  email: z.email(),
  password: z.string(),
  callbackURL: z.string().optional(),
});
