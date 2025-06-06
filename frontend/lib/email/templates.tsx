import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface EmailTemplateProps {
  name?: string;
  [key: string]: any;
}

const main = {
  backgroundColor: '#f8f9fa',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '40px',
  maxWidth: '600px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const logo = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#000000',
  marginBottom: '32px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  marginBottom: '24px',
  marginTop: '0',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '200px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '40px 0 20px',
};

const footer = {
  color: '#718096',
  fontSize: '14px',
};

export function WelcomeEmail({ name }: EmailTemplateProps) {
  const previewText = `Welcome to NovaTrek${name ? `, ${name}` : ''}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Welcome to NovaTrek{name ? `, ${name}` : ''}!</Heading>
          <Text style={text}>
            We're thrilled to have you join our community of travelers. NovaTrek is your personal AI-powered travel assistant, designed to make trip planning effortless and enjoyable.
          </Text>
          <Text style={text}>
            Here's what you can do with NovaTrek:
          </Text>
          <Section>
            <Text style={{ ...text, marginLeft: '20px' }}>
              • Plan multi-destination trips with ease<br />
              • Get personalized recommendations based on your preferences<br />
              • Build day-by-day itineraries<br />
              • Collaborate with travel companions<br />
              • Access your plans from anywhere
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips/new`}
            >
              Start Planning
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Happy travels,<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function TripSharedEmail({ tripName, sharedBy, shareUrl }: EmailTemplateProps) {
  const previewText = `${sharedBy} shared a trip with you on NovaTrek`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>A trip has been shared with you!</Heading>
          <Text style={text}>
            {sharedBy} has shared their trip "{tripName}" with you on NovaTrek.
          </Text>
          <Text style={text}>
            Click the button below to view the trip details, itinerary, and planned activities.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button style={button} href={shareUrl}>
              View Trip
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Safe travels,<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function BookingConfirmationEmail({ tripName, bookingDetails }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Booking Confirmed: {tripName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Booking Confirmed!</Heading>
          <Text style={text}>
            Great news! Your booking for "{tripName}" has been confirmed.
          </Text>
          <Section style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Booking Details
            </Heading>
            {bookingDetails}
          </Section>
          <Text style={text}>
            You can view and manage your booking in your NovaTrek dashboard.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips`}
            >
              View in Dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Happy travels,<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function PasswordResetEmail({ resetUrl }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset Your NovaTrek Password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Reset Your Password</Heading>
          <Text style={text}>
            We received a request to reset your password. Click the button below to create a new password.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={{ ...text, fontSize: '14px', color: '#718096' }}>
            If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function SubscriptionConfirmationEmail({ planName, features }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to NovaTrek {planName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Welcome to NovaTrek {planName}!</Heading>
          <Text style={text}>
            Thank you for upgrading your account. You now have access to all the premium features.
          </Text>
          <Section style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Your {planName} Features
            </Heading>
            <Text style={{ ...text, marginLeft: '20px', margin: '0' }}>
              {features?.map((feature: string, index: number) => (
                <span key={index}>
                  • {feature}
                  {index < features.length - 1 && <br />}
                </span>
              ))}
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/settings/billing`}
            >
              Manage Subscription
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Thank you for your support,<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}