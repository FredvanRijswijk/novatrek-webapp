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

// Marketplace Expert Email Templates

export function ExpertApplicationReceivedEmail({ businessName, email }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Your NovaTrek Expert Application Has Been Received</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Application Received!</Heading>
          <Text style={text}>
            Thank you for applying to become a NovaTrek Travel Expert. We've received your application for <strong>{businessName}</strong>.
          </Text>
          <Text style={text}>
            Our team will review your application within 2-3 business days. We'll evaluate:
          </Text>
          <Section>
            <Text style={{ ...text, marginLeft: '20px' }}>
              • Your experience and qualifications<br />
              • The quality of your portfolio<br />
              • Your proposed services and pricing<br />
              • Alignment with NovaTrek's community standards
            </Text>
          </Section>
          <Text style={text}>
            We'll send you an email at <strong>{email}</strong> once we've made a decision.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Best regards,<br />
            The NovaTrek Marketplace Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function ExpertApplicationApprovedEmail({ businessName, name }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Congratulations! Your NovaTrek Expert Application is Approved</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>🎉 Congratulations, {name}!</Heading>
          <Text style={text}>
            Great news! Your application to become a NovaTrek Travel Expert has been <strong>approved</strong>.
          </Text>
          <Text style={text}>
            <strong>{businessName}</strong> is now ready to join our marketplace. The next step is to complete your onboarding:
          </Text>
          <Section style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Next Steps
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              1. Complete Stripe Connect onboarding for payments<br />
              2. Set up your expert profile<br />
              3. List your first products or services<br />
              4. Start earning from your travel expertise!
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/expert/onboarding`}
            >
              Complete Onboarding
            </Button>
          </Section>
          <Text style={text}>
            Welcome to the NovaTrek expert community! We're excited to have you share your travel expertise with our users.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Welcome aboard,<br />
            The NovaTrek Marketplace Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function ExpertApplicationRejectedEmail({ businessName, name, reason }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on Your NovaTrek Expert Application</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Application Update</Heading>
          <Text style={text}>
            Dear {name},
          </Text>
          <Text style={text}>
            Thank you for your interest in becoming a NovaTrek Travel Expert. After careful review of your application for <strong>{businessName}</strong>, we've decided not to move forward at this time.
          </Text>
          {reason && (
            <Section style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
              <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
                Feedback
              </Heading>
              <Text style={{ ...text, margin: '0' }}>
                {reason}
              </Text>
            </Section>
          )}
          <Text style={text}>
            We encourage you to address the feedback above and reapply in the future. The travel industry is constantly evolving, and we'd love to reconsider your application once you've had time to develop your expertise further.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard`}
            >
              Return to Dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Best wishes,<br />
            The NovaTrek Marketplace Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function ExpertApplicationNeedsInfoEmail({ businessName, name, infoNeeded }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Additional Information Required for Your NovaTrek Expert Application</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Additional Information Required</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            We're reviewing your application for <strong>{businessName}</strong> and need some additional information to proceed.
          </Text>
          <Section style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Information Needed
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              {infoNeeded}
            </Text>
          </Section>
          <Text style={text}>
            Please provide this information as soon as possible so we can continue reviewing your application. You can reply directly to this email with the requested details.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/become-expert`}
            >
              View Application
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Thank you,<br />
            The NovaTrek Marketplace Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function ExpertNewOrderEmail({ expertName, orderDetails, customerName, amount }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>New Order Received - ${amount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>New Order Received! 🎉</Heading>
          <Text style={text}>
            Hi {expertName},
          </Text>
          <Text style={text}>
            Great news! You've received a new order from <strong>{customerName}</strong>.
          </Text>
          <Section style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Order Details
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              {orderDetails}
            </Text>
            <Text style={{ ...text, fontSize: '20px', fontWeight: '600', marginTop: '16px' }}>
              Total: ${amount}
            </Text>
          </Section>
          <Text style={text}>
            Please reach out to your customer promptly to begin delivering your service. Remember to maintain excellent communication throughout the process.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/expert`}
            >
              View Order Details
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Happy selling,<br />
            The NovaTrek Marketplace Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Subscription Lifecycle Email Templates

export function SubscriptionTrialEndingEmail({ name, daysLeft, planName }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Your NovaTrek trial ends in {daysLeft} days</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Your Trial is Ending Soon</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            Your NovaTrek {planName} trial will end in <strong>{daysLeft} days</strong>. We hope you've been enjoying all the premium features!
          </Text>
          <Section style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Don't lose access to:
            </Heading>
            <Text style={{ ...text, marginLeft: '20px', margin: '0' }}>
              • Unlimited trip planning<br />
              • AI-powered recommendations<br />
              • Multi-destination itineraries<br />
              • Group travel features<br />
              • Priority support
            </Text>
          </Section>
          <Text style={text}>
            Continue your subscription to keep all your trips and preferences. Your payment method will be charged automatically when the trial ends.
          </Text>
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
            Happy planning,<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function PaymentFailedEmail({ name, planName, retryUrl }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Action Required: Payment Failed for Your NovaTrek Subscription</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Payment Failed</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            We were unable to process your payment for your NovaTrek {planName} subscription. This might be due to:
          </Text>
          <Section>
            <Text style={{ ...text, marginLeft: '20px' }}>
              • Insufficient funds<br />
              • Expired card<br />
              • Card declined by your bank<br />
              • Outdated payment information
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>
              Action Required
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              Please update your payment method within 7 days to avoid service interruption.
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={{ ...button, backgroundColor: '#dc2626' }}
              href={retryUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/settings/billing`}
            >
              Update Payment Method
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Need help? Reply to this email or contact support@novatrek.app<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function SubscriptionRenewalEmail({ name, planName, amount, renewalDate }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Your NovaTrek subscription will renew on {renewalDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Subscription Renewal Notice</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            This is a friendly reminder that your NovaTrek {planName} subscription will automatically renew on <strong>{renewalDate}</strong>.
          </Text>
          <Section style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Renewal Details
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              Plan: {planName}<br />
              Amount: ${amount}<br />
              Renewal Date: {renewalDate}
            </Text>
          </Section>
          <Text style={text}>
            No action is needed if you'd like to continue enjoying NovaTrek. Your payment method on file will be charged automatically.
          </Text>
          <Text style={{ ...text, fontSize: '14px', color: '#718096' }}>
            If you'd like to cancel or change your plan, you can do so anytime from your account settings.
          </Text>
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
            Thank you for being a valued member,<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function SubscriptionCancelledEmail({ name }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>We're sorry to see you go</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Subscription Cancelled</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            Your NovaTrek subscription has been cancelled. You'll continue to have access to premium features until the end of your current billing period.
          </Text>
          <Text style={text}>
            We'd love to hear why you decided to cancel. Your feedback helps us improve NovaTrek for all travelers.
          </Text>
          <Section style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              You'll always have access to:
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              • Your saved trips and itineraries<br />
              • Basic trip planning features<br />
              • Your travel preferences<br />
              • Previously shared trips
            </Text>
          </Section>
          <Text style={text}>
            Changed your mind? You can reactivate your subscription anytime.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/pricing`}
            >
              View Plans
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

// Trip Reminder Email Templates

export function TripReminderEmail({ name, tripName, daysUntil, destination, startDate }: EmailTemplateProps) {
  const isOneDayReminder = daysUntil === 1;
  const subject = isOneDayReminder 
    ? `Tomorrow: Your trip to ${destination}!` 
    : `${daysUntil} days until your trip to ${destination}`;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>
            {isOneDayReminder ? '🎒 Pack Your Bags!' : '📅 Trip Reminder'}
          </Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            {isOneDayReminder 
              ? `Your trip "${tripName}" to ${destination} starts tomorrow!`
              : `Just ${daysUntil} days until your trip "${tripName}" to ${destination}!`
            }
          </Text>
          <Section style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Trip Details
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              Destination: {destination}<br />
              Start Date: {startDate}<br />
              Status: Ready to go! ✈️
            </Text>
          </Section>
          {isOneDayReminder ? (
            <>
              <Text style={text}>
                <strong>Last-minute checklist:</strong>
              </Text>
              <Section>
                <Text style={{ ...text, marginLeft: '20px' }}>
                  ✓ Check-in for flights<br />
                  ✓ Confirm accommodations<br />
                  ✓ Review your itinerary<br />
                  ✓ Check weather forecast<br />
                  ✓ Charge your devices<br />
                  ✓ Prepare travel documents
                </Text>
              </Section>
            </>
          ) : (
            <Text style={text}>
              Now's a great time to finalize your plans, check your packing list, and make any last-minute adjustments to your itinerary.
            </Text>
          )}
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips`}
            >
              View Trip Details
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Have a wonderful trip!<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function TripFeedbackEmail({ name, tripName, destination }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>How was your trip to {destination}?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Welcome Back! 🏠</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            We hope you had an amazing time in {destination}! Your trip "{tripName}" has ended, and we'd love to hear about your experience.
          </Text>
          <Section style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Share Your Experience
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              • How was your itinerary?<br />
              • Did you discover any hidden gems?<br />
              • Any tips for future travelers?<br />
              • Upload your favorite photos!
            </Text>
          </Section>
          <Text style={text}>
            Your feedback helps us improve trip recommendations for you and fellow travelers.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips`}
            >
              Share Feedback
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Already planning your next adventure?<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Buyer Order Confirmation Email

export function BuyerOrderConfirmationEmail({ buyerName, productName, expertName, amount, orderDate }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Order Confirmed: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Order Confirmed! ✅</Heading>
          <Text style={text}>
            Hi {buyerName},
          </Text>
          <Text style={text}>
            Thank you for your purchase! Your order for <strong>{productName}</strong> from {expertName} has been confirmed.
          </Text>
          <Section style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <Heading as="h2" style={{ ...h1, fontSize: '18px', marginBottom: '16px' }}>
              Order Details
            </Heading>
            <Text style={{ ...text, margin: '0' }}>
              Product: {productName}<br />
              Expert: {expertName}<br />
              Amount: ${amount}<br />
              Order Date: {orderDate}<br />
              Order ID: #{Math.random().toString(36).substring(2, 9).toUpperCase()}
            </Text>
          </Section>
          <Text style={text}>
            <strong>What happens next?</strong>
          </Text>
          <Text style={text}>
            {expertName} will contact you within 24 hours to begin delivering your service. Please check your email for their message.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/purchases`}
            >
              View Order
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Questions? Contact support@novatrek.app<br />
            The NovaTrek Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Email Verification Template

export function EmailVerificationEmail({ verificationUrl }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your NovaTrek email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>✈️ NovaTrek</Text>
          <Heading style={h1}>Verify Your Email</Heading>
          <Text style={text}>
            Welcome to NovaTrek! Please verify your email address to complete your registration and access all features.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
            <Button
              style={button}
              href={verificationUrl}
            >
              Verify Email Address
            </Button>
          </Section>
          <Text style={{ ...text, fontSize: '14px', color: '#718096' }}>
            If you didn't create a NovaTrek account, you can safely ignore this email.
          </Text>
          <Text style={{ ...text, fontSize: '14px', color: '#718096' }}>
            This link will expire in 24 hours for security reasons.
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