import { ReactNode } from 'react';

import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ThemeProvider } from './ThemeProvider';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
};

export default Providers;
