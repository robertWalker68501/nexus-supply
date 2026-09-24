import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import SidebarNavigation from '@/components/sidebar/SidebarNavigation';
import SidebarUserMenu from '@/components/sidebar/SidebarUserMenu';
import SiteLogo from '@/components/SiteLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';

type UserRole = 'USER' | 'MANAGER' | 'CUSTOMER' | 'CSR';

const AppSidebar = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  const role = session.user.role as UserRole;

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='border-sidebar-border border-b'>
        <SiteLogo
          href='/dashboard'
          classNames='h-10 px-2 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 [&>img]:shrink-0 group-data-[collapsible=icon]:[&>img]:size-6'
          textClassNames='group-data-[collapsible=icon]:hidden'
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation role={role} />
      </SidebarContent>
      <SidebarFooter className='border-sidebar-border border-t'>
        <SidebarUserMenu
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
          role={role}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
