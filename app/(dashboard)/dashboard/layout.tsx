import { ReactNode } from 'react';

import AppSidebar from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className='min-w-0 flex-1'>
        <div className='border-border bg-background/95 sticky top-0 z-40 flex h-14 items-center border-b px-4 backdrop-blur'>
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
};

export default DashboardLayout;
