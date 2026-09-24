import { ReactNode } from 'react';

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className='flex h-dvh flex-col items-center justify-center'>
      {children}
    </div>
  );
};

export default AuthLayout;
