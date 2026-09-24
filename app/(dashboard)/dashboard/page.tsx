import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Headphones,
  PackageSearch,
  Route,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/auth';

import type { LucideIcon } from 'lucide-react';

type UserRole = 'USER' | 'MANAGER' | 'CUSTOMER' | 'CSR';

type WorkArea = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
};

type DashboardView = {
  eyebrow: string;
  title: string;
  description: string;
  workAreas: readonly WorkArea[];
  nextSteps: readonly string[];
};

const dashboardViews: Record<UserRole, DashboardView> = {
  USER: {
    eyebrow: 'Operations workspace',
    title: 'Keep daily operations moving',
    description:
      'Your workspace will bring inventory, purchasing, and fulfillment tasks together as those workflows are configured.',
    workAreas: [
      {
        title: 'Inventory visibility',
        description: 'Monitor stock levels and product availability.',
        icon: Boxes,
      },
      {
        title: 'Purchasing coordination',
        description: 'Coordinate vendor purchasing and replenishment.',
        icon: ClipboardList,
      },
      {
        title: 'Fulfillment tracking',
        description: 'Follow orders through the fulfillment process.',
        icon: Route,
      },
    ],
    nextSteps: [
      'Confirm your assigned client businesses',
      'Review your operational permissions',
      'Complete your workspace profile',
    ],
  },
  MANAGER: {
    eyebrow: 'Management workspace',
    title: 'Coordinate teams and client operations',
    description:
      'Your management view will provide oversight across authorized businesses without mixing client data.',
    workAreas: [
      {
        title: 'Team coordination',
        description: 'Organize responsibilities across your operations team.',
        icon: Users,
      },
      {
        title: 'Client oversight',
        description: 'Review each client business in its own workspace.',
        icon: Building2,
      },
      {
        title: 'Performance reporting',
        description: 'Track operational trends and service performance.',
        icon: BarChart3,
      },
    ],
    nextSteps: [
      'Review team roles and access',
      'Confirm assigned client businesses',
      'Define operational reporting needs',
    ],
  },
  CUSTOMER: {
    eyebrow: 'Customer workspace',
    title: 'Manage your supply network',
    description:
      'Set up the vendors, products, inventory, and orders your business will manage through NexusSupply.',
    workAreas: [
      {
        title: 'Vendor network',
        description: 'Add and maintain the vendors your business works with.',
        icon: Building2,
        href: '/dashboard/vendors',
      },
      {
        title: 'Product catalog',
        description: 'Build your catalog and prepare products for ordering.',
        icon: PackageSearch,
        href: '/dashboard/products',
      },
      {
        title: 'Order management',
        description: 'Create and review purchase orders for your business.',
        icon: ShoppingCart,
        href: '/dashboard/orders',
      },
    ],
    nextSteps: [
      'Add your first vendor',
      'Create your product catalog',
      'Review inventory requirements',
    ],
  },
  CSR: {
    eyebrow: 'Customer service workspace',
    title: 'Support customers with confidence',
    description:
      'Your service view will centralize authorized customer requests, order questions, and issue follow-up.',
    workAreas: [
      {
        title: 'Customer requests',
        description: 'Review requests from the customers you support.',
        icon: Headphones,
      },
      {
        title: 'Order assistance',
        description: 'Help customers understand order status and next steps.',
        icon: ShoppingCart,
      },
      {
        title: 'Issue follow-up',
        description: 'Track service issues through resolution.',
        icon: ClipboardList,
      },
    ],
    nextSteps: [
      'Confirm your customer assignments',
      'Review service escalation procedures',
      'Complete your support profile',
    ],
  },
};

const roleLabels: Record<UserRole, string> = {
  USER: 'Operator',
  MANAGER: 'Manager',
  CUSTOMER: 'Customer',
  CSR: 'Customer service',
};

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  const role = session.user.role as UserRole;
  const view = dashboardViews[role] ?? dashboardViews.USER;
  const firstName = session.user.name.trim().split(/\s+/)[0];

  return (
    <div className='mx-auto w-full max-w-7xl space-y-8 p-5 sm:p-8'>
      <header className='relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8'>
        <div
          aria-hidden='true'
          className='bg-primary/10 absolute -top-20 -right-16 size-64 rounded-full blur-3xl'
        />
        <div className='relative max-w-3xl'>
          <div className='mb-4 flex flex-wrap items-center gap-3'>
            <p className='text-primary text-sm font-semibold tracking-wider uppercase'>
              {view.eyebrow}
            </p>
            <Badge variant='secondary'>{roleLabels[role]}</Badge>
          </div>
          <h1 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
            Welcome back, {firstName}
          </h1>
          <h2 className='mt-3 text-lg font-medium'>{view.title}</h2>
          <p className='text-muted-foreground mt-2 max-w-2xl leading-7'>
            {view.description}
          </p>
        </div>
      </header>

      {role === 'CUSTOMER' && (
        <section aria-labelledby='quick-actions-title'>
          <div className='mb-4'>
            <h2
              id='quick-actions-title'
              className='font-heading text-xl font-semibold'
            >
              Quick actions
            </h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              Start setting up your business workspace.
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Link
              href='/dashboard/vendors/new'
              className={buttonVariants({ size: 'lg' })}
            >
              Add vendor
            </Link>
            <Link
              href='/dashboard/products/new'
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Add product
            </Link>
            <Link
              href='/dashboard/orders/new'
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Create order
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby='work-areas-title'>
        <div className='mb-4'>
          <h2
            id='work-areas-title'
            className='font-heading text-xl font-semibold'
          >
            Your work areas
          </h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            Tools and workflows available for your role.
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {view.workAreas.map((area) => (
            <Card key={area.title}>
              <CardHeader>
                <div className='bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg'>
                  <area.icon
                    className='size-5'
                    aria-hidden='true'
                  />
                </div>
                <CardTitle>{area.title}</CardTitle>
                <CardDescription>{area.description}</CardDescription>
                <CardAction>
                  <Badge variant='outline'>Coming soon</Badge>
                </CardAction>
              </CardHeader>
              {area.href && (
                <CardContent>
                  <Link
                    href={area.href}
                    className='text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline'
                  >
                    Open workspace
                    <ArrowRight
                      className='size-4'
                      aria-hidden='true'
                    />
                  </Link>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby='next-steps-title'>
        <Card>
          <CardHeader>
            <CardTitle id='next-steps-title'>Recommended next steps</CardTitle>
            <CardDescription>
              Prepare your workspace for the workflows available to your role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className='grid gap-3 sm:grid-cols-3'>
              {view.nextSteps.map((step, index) => (
                <li
                  key={step}
                  className='bg-muted/50 flex gap-3 rounded-lg p-4'
                >
                  <span className='bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                    {index + 1}
                  </span>
                  <span className='text-sm leading-6'>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
