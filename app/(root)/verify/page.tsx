import { MailCheck } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const VerifyPage = () => {
  return (
    <section className='page-wrapper flex min-h-[calc(100dvh-9rem)] items-center justify-center py-16'>
      <Card className='w-full max-w-lg text-center'>
        <CardHeader className='items-center'>
          <span className='bg-primary/10 text-primary mb-3 flex size-14 items-center justify-center rounded-full'>
            <MailCheck
              className='size-7'
              aria-hidden='true'
            />
          </span>
          <CardTitle className='text-2xl'>Check your email</CardTitle>
          <CardDescription className='max-w-sm text-base leading-6'>
            We sent you a verification link. Open the email and select
            &quot;Verify your email&quot; to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            After verification, you&apos;ll be signed in and redirected to your
            dashboard.
          </p>
          <p className='text-muted-foreground text-sm'>
            Already verified?{' '}
            <Link
              href='/sign-in'
              className='text-primary font-medium underline-offset-4 hover:underline'
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default VerifyPage;
