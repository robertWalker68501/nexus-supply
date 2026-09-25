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
import { signInUserSchema } from '@/lib/schemas/UserSchema';

const SignInUserForm = ({ callbackURL = '/dashboard' }: { callbackURL?: string }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof signInUserSchema>>({
    resolver: zodResolver(signInUserSchema),
    defaultValues: {
      email: '',
      password: '',
      callbackURL: '',
    },
  });

  const onSubmit = (data: z.infer<typeof signInUserSchema>) => {
    const { email, password } = data;

    startTransition(async () => {
      await authClient.signIn.email(
        {
          email,
          password,
          callbackURL,
        },
        {
          onSuccess: () => {
            toast.add({
              type: 'success',
              title: 'Signed in successfully',
            });
            router.push(callbackURL);
            router.refresh();
          },
          onError: () => {
            toast.add({
              type: 'error',
              title: 'Failed to sign in',
            });
          },
        }
      );
    });
  };

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    });
  };

  const signInWithGithub = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL,
    });
  };

  return (
    <Card className='mx-auto max-w-lg'>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in to your dashboard</CardDescription>
      </CardHeader>
      <form
        id='create-account'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <CardContent>
          <FieldGroup>
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
            <div className='flex w-full flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Button
                    type='submit'
                    form='create-account'
                    disabled={isPending}
                  >
                    {isPending ? <Spinner /> : 'Sign In'}
                  </Button>
                </div>
                <p className='text-muted-foreground text-sm'>
                  Don&apos;t have an accout?{' '}
                  <Link
                    href={`/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`}
                    className='hover:text-primary'
                  >
                    Sign Up
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

export default SignInUserForm;
