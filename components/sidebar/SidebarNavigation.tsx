'use client';

import {
  Boxes,
  Building2,
  CirclePlus,
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  PackageSearch,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import type { LucideIcon } from 'lucide-react';

export type UserRole = 'USER' | 'MANAGER' | 'CUSTOMER' | 'CSR';

type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: readonly NavigationItem[];
};

const dashboardGroup: NavigationGroup = {
  label: 'Overview',
  items: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
  ],
};

const customerGroups: readonly NavigationGroup[] = [
  dashboardGroup,
  {
    label: 'Vendors',
    items: [
      {
        title: 'View vendors',
        href: '/dashboard/vendors',
        icon: Building2,
      },
      {
        title: 'Add vendor',
        href: '/dashboard/vendors/new',
        icon: CirclePlus,
      },
    ],
  },
  {
    label: 'Products',
    items: [
      {
        title: 'List products',
        href: '/dashboard/products',
        icon: PackageSearch,
      },
      {
        title: 'Add product',
        href: '/dashboard/products/new',
        icon: CirclePlus,
      },
      {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: Boxes,
      },
    ],
  },
  {
    label: 'Orders',
    items: [
      {
        title: 'View orders',
        href: '/dashboard/orders',
        icon: ListOrdered,
      },
      {
        title: 'Create order',
        href: '/dashboard/orders/new',
        icon: ShoppingCart,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Business settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        title: 'Support',
        href: '/dashboard/support',
        icon: LifeBuoy,
      },
    ],
  },
];

const navigationByRole: Record<UserRole, readonly NavigationGroup[]> = {
  USER: [dashboardGroup],
  MANAGER: [dashboardGroup],
  CUSTOMER: customerGroups,
  CSR: [dashboardGroup],
};

const SidebarNavigation = ({ role }: { role: UserRole }) => {
  const pathname = usePathname();
  const navigationGroups = navigationByRole[role] ?? [dashboardGroup];

  return navigationGroups.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <item.icon aria-hidden='true' />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
};

export default SidebarNavigation;
