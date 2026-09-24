import { Public_Sans, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { cn } from '@/lib/utils';
import Providers from '@/providers/Providers';

import type { Metadata } from 'next';

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-heading',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'NexusSuuply',
  description:
    'Streamline your multi-business supply chain from one dashboard. Optimize inventory, automate logistics, and scale your B2B operations with ease.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      className={cn(
        'h-full',
        'antialiased',
        'font-sans',
        publicSans.variable,
        jetbrainsMonoHeading.variable
      )}
      suppressHydrationWarning
    >
      <body
        className='flex min-h-full flex-col'
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
