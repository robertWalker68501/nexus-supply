'use client';

import { ChevronsUpDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';

type SidebarUserMenuProps = {
  name: string;
  email: string;
  image?: string | null;
  role: string;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const SidebarUserMenu = ({
  name,
  email,
  image,
  role,
}: SidebarUserMenuProps) => {
  const router = useRouter();

  const signOutUser = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace('/');
          router.refresh();
        },
      },
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                tooltip={`${name} account menu`}
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
              >
                <Avatar size='sm'>
                  <AvatarImage
                    src={image ?? undefined}
                    alt=''
                  />
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
                  <p className='truncate font-medium'>{name}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {role}
                  </p>
                </div>
                <ChevronsUpDown className='ml-auto group-data-[collapsible=icon]:hidden' />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            side='right'
            align='end'
            className='w-64'
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='font-normal'>
                <p className='text-foreground truncate text-sm font-medium'>
                  {name}
                </p>
                <p className='truncate text-xs'>{email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant='destructive'
                onClick={signOutUser}
              >
                <LogOut aria-hidden='true' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default SidebarUserMenu;
