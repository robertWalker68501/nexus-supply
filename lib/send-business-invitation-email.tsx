import { Resend } from 'resend';

import BusinessInvitationEmail from '@/emails/business-invitation-email';

const resend = new Resend(process.env.RESEND_API_KEY);

const roleLabels = {
  CLIENT_ADMIN: 'Client administrator',
  MANAGER: 'Manager',
  RECEIVING: 'Receiving',
  SHIPPING: 'Shipping',
  CUSTOMER_SERVICE: 'Customer service',
  VIEWER: 'Viewer',
} as const;

export async function sendBusinessInvitationEmail({
  to,
  businessName,
  role,
  invitationUrl,
  expiresAt,
}: {
  to: string;
  businessName: string;
  role: keyof typeof roleLabels;
  invitationUrl: string;
  expiresAt: Date;
}) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: `You're invited to ${businessName} on NexusSupply`,
    react: (
      <BusinessInvitationEmail
        businessName={businessName}
        roleLabel={roleLabels[role]}
        invitationUrl={invitationUrl}
        expiresAt={expiresAt}
      />
    ),
  });
}
