import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import BusinessSwitcher from '@/components/businesses/BusinessSwitcher';
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
import { getBusinessContext } from '@/lib/businesses/context';

type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'CLIENT_ADMIN'
  | 'MANAGER'
  | 'RECEIVING'
  | 'SHIPPING'
  | 'CUSTOMER_SERVICE'
  | 'VIEWER';

const AppSidebar = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  const businessContext = session.user.role ? null : await getBusinessContext();
  const activeMembership = businessContext?.activeMembership ?? null;

  const role = (session.user.role ?? activeMembership?.role ?? 'VIEWER') as UserRole;
  const roleLabel = session.user.role ?? activeMembership?.role ?? 'NO ACCESS';

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
        {activeMembership && businessContext && (
          <BusinessSwitcher
            activeBusinessId={activeMembership.businessId}
            businesses={businessContext.memberships.map((membership) => ({
              id: membership.businessId,
              name: membership.business.name,
            }))}
          />
        )}
        <SidebarNavigation role={role} activeBusinessId={activeMembership?.businessId} />
      </SidebarContent>
      <SidebarFooter className='border-sidebar-border border-t'>
        <SidebarUserMenu
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
          role={roleLabel}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
