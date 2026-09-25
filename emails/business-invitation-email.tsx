import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type Props = {
  businessName: string;
  roleLabel: string;
  invitationUrl: string;
  expiresAt: Date;
};

const BusinessInvitationEmail = ({
  businessName,
  roleLabel,
  invitationUrl,
  expiresAt,
}: Props) => (
  <Html>
    <Head />
    <Preview>You have been invited to {businessName} on NexusSupply</Preview>
    <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f6f6f6' }}>
      <Container style={{ margin: '40px auto', padding: '24px', backgroundColor: '#ffffff' }}>
        <Heading>You're invited to NexusSupply</Heading>
        <Text>
          You have been invited to join <strong>{businessName}</strong> as{' '}
          <strong>{roleLabel}</strong>.
        </Text>
        <Section style={{ margin: '24px 0' }}>
          <Button href={invitationUrl}>Accept invitation</Button>
        </Section>
        <Text>
          This invitation expires on {expiresAt.toLocaleDateString()}.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default BusinessInvitationEmail;
