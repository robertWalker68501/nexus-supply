'use client';

import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';

const UserMenu = () => {
  const router = useRouter();

  const signOutUser = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/');
          router.refresh();
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full'
          >
            <Avatar>
              <AvatarImage
                src='https://github.com/shadcn.png'
                alt='shadcn'
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent className='w-32'>
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href='/dashboard' />}>
            <LayoutDashboard />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant='destructive'
            onClick={signOutUser}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
