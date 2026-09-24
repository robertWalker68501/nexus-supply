import { Construction } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/auth';

const customerPages = {
  vendors: {
    title: 'Vendors',
    description: 'View and manage your vendor relationships.',
  },
  'vendors/new': {
    title: 'Add vendor',
    description: 'Create a vendor record for your business.',
  },
  products: {
    title: 'Products',
    description: 'View and manage your product catalog.',
  },
  'products/new': {
    title: 'Add product',
    description: 'Add a product to your business catalog.',
  },
  inventory: {
    title: 'Inventory',
    description: 'Review stock levels across your business.',
  },
  orders: {
    title: 'Orders',
    description: 'View and track your purchase orders.',
  },
  'orders/new': {
    title: 'Create order',
    description: 'Create a new purchase order.',
  },
  settings: {
    title: 'Business settings',
    description: 'Manage your business profile and preferences.',
  },
  support: {
    title: 'Support',
    description: 'Get help with your NexusSupply workspace.',
  },
} as const;

type CustomerPageKey = keyof typeof customerPages;

type CustomerPlaceholderPageProps = {
  params: Promise<{
    section: string;
    action?: string[];
  }>;
};

const CustomerPlaceholderPage = async ({
  params,
}: CustomerPlaceholderPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');
  if (session.user.role !== 'CUSTOMER') redirect('/dashboard');

  const { section, action = [] } = await params;
  const pageKey = [section, ...action].join('/');

  if (!(pageKey in customerPages)) notFound();

  const page = customerPages[pageKey as CustomerPageKey];

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-6'>
      <Card className='w-full'>
        <CardHeader>
          <div className='bg-primary/10 text-primary mb-3 flex size-11 items-center justify-center rounded-lg'>
            <Construction
              className='size-5'
              aria-hidden='true'
            />
          </div>
          <CardTitle className='text-2xl'>{page.title}</CardTitle>
          <CardDescription className='text-base'>
            {page.description}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            This feature is coming soon. The page is available as a placeholder
            while its workflow is being built.
          </p>
          <Link
            href='/dashboard'
            className='text-primary inline-flex text-sm font-medium underline-offset-4 hover:underline'
          >
            Return to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPlaceholderPage;
