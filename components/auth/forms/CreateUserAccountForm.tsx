'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { IoLogoGithub } from 'react-icons/io5';
import * as z from 'zod';

import { FormFieldControl } from '@/components/form-fields/FormFieldControl';
import SeparatorWithText from '@/components/SeparatorWithText';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { createUserAccountSchema } from '@/lib/schemas/UserSchema';

const CreateUserAccountForm = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof createUserAccountSchema>>({
    resolver: zodResolver(createUserAccountSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      callbackURL: '',
    },
  });

  const onSubmit = (data: z.infer<typeof createUserAccountSchema>) => {
    const { name, email, password } = data;

    startTransition(async () => {
      await authClient.signUp.email(
        {
          name,
          email,
          password,
          callbackURL: '/dashboard',
        },
        {
          onSuccess: () => {
            toast.add({
              type: 'success',
              title: 'Account created successfully',
              description: 'Please check your email to verify your account',
            });
            router.replace('/verify');
            router.refresh();
          },
          onError: () => {
            toast.add({
              type: 'error',
              title: 'Failed to create account',
            });
          },
        }
      );
    });
  };

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
    });
  };

  const signInWithGithub = async () => {
    await authClient.signIn.social({
      provider: 'github',
    });
  };

  return (
    <Card className='mx-auto max-w-lg'>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Create an accout to to get started</CardDescription>
      </CardHeader>
      <form
        id='create-account'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <CardContent>
          <FieldGroup>
            <FormFieldControl
              control={form.control}
              name='name'
              label='Full Name'
              type='text'
              placeholder='John Doe'
              required
            />
            <FormFieldControl
              control={form.control}
              name='email'
              label='Email'
              type='email'
              placeholder='john.doe@exapmle.com'
              required
            />
            <FormFieldControl
              control={form.control}
              name='password'
              label='Password'
              type='password'
              placeholder='********'
              required
            />
            <FormFieldControl
              control={form.control}
              name='confirmPassword'
              label='Confirm Password'
              type='password'
              placeholder='********'
              required
            />
            <div className='flex w-full flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => form.reset()}
                    disabled={isPending}
                  >
                    Clear
                  </Button>
                  <Button
                    type='submit'
                    form='create-account'
                    disabled={isPending}
                  >
                    {isPending ? <Spinner /> : 'Sign Up'}
                  </Button>
                </div>
                <p className='text-muted-foreground text-sm'>
                  Already have an accout?{' '}
                  <Link
                    href='/sign-in'
                    className='hover:text-primary'
                  >
                    Sign In
                  </Link>
                </p>
              </div>
              <SeparatorWithText text='or' />
              <div className='flex flex-col gap-4'>
                <Button
                  variant='outline'
                  onClick={signInWithGoogle}
                >
                  Sign in with Google <FcGoogle />
                </Button>
                <Button
                  variant='outline'
                  onClick={signInWithGithub}
                >
                  Sign in with GitHub <IoLogoGithub />
                </Button>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </form>
    </Card>
  );
};

export default CreateUserAccountForm;
