import Link from 'next/link';

import { buttonVariants } from '../ui/button';

const AuthButtons = () => {
  return (
    <div className='flex items-center gap-4'>
      <Link
        href='/sign-in'
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        Sign In
      </Link>
      <Link
        href='/sign-up'
        className={buttonVariants({ size: 'sm' })}
      >
        Get Started
      </Link>
    </div>
  );
};

export default AuthButtons;
