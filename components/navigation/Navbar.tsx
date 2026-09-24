import { headers } from 'next/headers';

import { NAV_LINKS } from '@/constants';
import { auth } from '@/lib/auth';

import AuthButtons from '../auth/AuthButtons';
import UserMenu from '../auth/UserMenu';
import SiteLogo from '../SiteLogo';
import { ThemeToggle } from '../ui/theme-toggle';

import MobileNav from './MobileNav';
import NavLink from './NavLink';

const Navbar = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <nav className='flex items-center justify-between'>
      {/* Site Logo */}
      <SiteLogo href='/' />

      {/* Dashboard Nav */}
      <div className='hidden items-center gap-4 md:flex'>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.id}
            href={link.href}
            label={link.label}
          />
        ))}
        {session ? <UserMenu /> : <AuthButtons />}
        <ThemeToggle />
      </div>

      {/* Mobile Nav */}
      <div className='block md:hidden'>
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
