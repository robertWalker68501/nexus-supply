import Link from 'next/link';

const Footer = () => {
  return (
    <footer className='border-border border-t bg-zinc-200/10 py-4 dark:bg-zinc-900/50'>
      <div className='page-wrapper'>
        <p className='text-muted-foreground text-sm'>
          NexusSupply &copy; {new Date().getFullYear()} |{' '}
          <Link
            href='/'
            className='hover:text-primary'
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
