import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Headphones,
  PackageSearch,
  Route,
  Users,
} from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { getBusinessContext } from '@/lib/businesses/context';

import type { LucideIcon } from 'lucide-react';

type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'CLIENT_ADMIN'
  | 'MANAGER'
  | 'RECEIVING'
  | 'SHIPPING'
  | 'CUSTOMER_SERVICE'
  | 'VIEWER';

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
  OWNER: {
    eyebrow: 'Owner workspace',
    title: 'Manage NexusSupply operations',
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
  ADMIN: {
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
  CLIENT_ADMIN: {
    eyebrow: 'Client administration',
    title: 'Manage your client business',
    description:
      'Administer users and access for the active client business without platform-level privileges.',
    workAreas: [
      {
        title: 'Team administration',
        description: 'Manage the users and roles assigned to this client business.',
        icon: Users,
      },
    ],
    nextSteps: [
      'Review client-business users',
      'Confirm role assignments',
      'Continue to operational workflows',
    ],
  },
  MANAGER: {
    eyebrow: 'Client business', title: 'Manage your supply-chain operations',
    description: 'Your access is scoped to the client businesses assigned to your account.',
    workAreas: [{ title: 'Business operations', description: 'Manage the workflows permitted for your assigned business.', icon: Building2 }],
    nextSteps: ['Select your client business', 'Review your assigned permissions', 'Begin managing supply-chain activity'],
  },
  RECEIVING: {
    eyebrow: 'Client business', title: 'Receiving workspace',
    description: 'Your access is limited to receiving workflows for your assigned client business.',
    workAreas: [{ title: 'Receiving', description: 'Receive inbound inventory without access to shipping workflows.', icon: PackageSearch }],
    nextSteps: ['Select your client business', 'Review inbound work', 'Process authorized receiving activity'],
  },
  SHIPPING: {
    eyebrow: 'Client business', title: 'Shipping workspace',
    description: 'Your access is limited to shipping workflows for your assigned client business.',
    workAreas: [{ title: 'Shipping', description: 'Process outbound fulfillment without access to receiving workflows.', icon: Route }],
    nextSteps: ['Select your client business', 'Review outbound work', 'Process authorized shipping activity'],
  },
  CUSTOMER_SERVICE: {
    eyebrow: 'Client business', title: 'Customer service workspace',
    description: 'Your access is limited to customer-service workflows for your assigned client business.',
    workAreas: [{ title: 'Customer service', description: 'Work with the customer-service tools granted to your role.', icon: Headphones }],
    nextSteps: ['Select your client business', 'Review customer activity', 'Work within your assigned permissions'],
  },
  VIEWER: {
    eyebrow: 'Client business', title: 'Business overview',
    description: 'Your account has read-only access to the client businesses assigned to you.',
    workAreas: [{ title: 'Supply-chain visibility', description: 'Review authorized business information without operational changes.', icon: Boxes }],
    nextSteps: ['Select your client business', 'Review available information', 'Contact an administrator if you need additional access'],
  },
};

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  CLIENT_ADMIN: 'Client administrator',
  MANAGER: 'Manager',
  RECEIVING: 'Receiving',
  SHIPPING: 'Shipping',
  CUSTOMER_SERVICE: 'Customer service',
  VIEWER: 'Viewer',
};

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  const businessContext = session.user.role ? null : await getBusinessContext();
  const activeMembership = businessContext?.activeMembership ?? null;

  if (!session.user.role && !activeMembership) {
    return (
      <div className='mx-auto w-full max-w-2xl p-5 sm:p-8'>
        <Card>
          <CardHeader>
            <CardTitle>No client business access</CardTitle>
            <CardDescription>
              Your account is signed in, but it has not been assigned to a client business yet. Contact your NexusSupply administrator for access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const role = (session.user.role ?? activeMembership?.role) as UserRole;
  const view = dashboardViews[role];
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
            {activeMembership && (
              <Badge variant='outline'>{activeMembership.business.name}</Badge>
            )}
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
