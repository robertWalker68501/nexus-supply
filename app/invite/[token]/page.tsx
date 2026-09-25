import { headers } from 'next/headers';
import Link from 'next/link';

import { acceptBusinessInvitation } from './actions';
import { auth } from '@/lib/auth';
import { hashBusinessInvitationToken } from '@/lib/businesses/invitations';
import prisma from '@/lib/prisma';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const roleLabels = {
  CLIENT_ADMIN: 'Client administrator',
  MANAGER: 'Manager',
  RECEIVING: 'Receiving',
  SHIPPING: 'Shipping',
  CUSTOMER_SERVICE: 'Customer service',
  VIEWER: 'Viewer',
} as const;

export default async function BusinessInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const invitation = await prisma.businessInvitation.findUnique({
    where: { tokenHash: hashBusinessInvitationToken(token) },
    include: { business: { select: { name: true } } },
  });

  const valid =
    invitation &&
    invitation.status === 'PENDING' &&
    invitation.expiresAt > new Date();

  if (!valid) {
    return (
      <div className='mx-auto max-w-lg p-6'>
        <Card>
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
            <CardDescription>This invitation is invalid, expired, or has already been used.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const callbackURL = `/invite/${token}`;

  return (
    <div className='mx-auto max-w-lg p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Join {invitation.business.name}</CardTitle>
          <CardDescription>
            You were invited as {roleLabels[invitation.role]}.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error === 'email' && (
            <Alert variant='destructive'>
              <AlertTitle>Different account signed in</AlertTitle>
              <AlertDescription>
                Sign in with {invitation.email} to accept this invitation.
              </AlertDescription>
            </Alert>
          )}
          {error === 'platform' && (
            <Alert variant='destructive'>
              <AlertTitle>Platform account cannot accept</AlertTitle>
              <AlertDescription>
                Platform owners and administrators cannot also be client-business members.
              </AlertDescription>
            </Alert>
          )}

          {!session ? (
            <div className='flex gap-3'>
              <Button
                nativeButton={false}
                render={<Link href={`/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`} />}
              >
                Create account
              </Button>
              <Button
                variant='outline'
                nativeButton={false}
                render={<Link href={`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`} />}
              >
                Sign in
              </Button>
            </div>
          ) : (
            <form action={acceptBusinessInvitation.bind(null, token)}>
              <Button type='submit'>Accept invitation</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
