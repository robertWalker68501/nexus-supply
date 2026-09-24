import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import GoBackButton from '@/components/GoBackButton';
import { auth } from '@/lib/auth';

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect('/dashboard');

  return (
    <>
      <div className='absolute top-5 left-5'>
        <GoBackButton
          href='/'
          text='Go Back'
        />
      </div>
      <div className='flex h-dvh flex-col items-center justify-center'>
        {children}
      </div>
    </>
  );
};

export default AuthLayout;
