import { auth } from '@/lib/firebase';

export type EmailTemplate = 
  | 'WelcomeEmail'
  | 'TripSharedEmail'
  | 'BookingConfirmationEmail'
  | 'PasswordResetEmail'
  | 'SubscriptionConfirmationEmail';

export interface SendEmailParams {
  template: EmailTemplate;
  to: string | string[];
  subject: string;
  data?: Record<string, any>;
  replyTo?: string;
}

export async function sendTransactionalEmail(params: SendEmailParams) {
  try {
    // Get the current user's auth token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Convenience functions for specific email types
export async function sendWelcomeEmail(to: string, name?: string) {
  return sendTransactionalEmail({
    template: 'WelcomeEmail',
    to,
    subject: 'Welcome to NovaTrek - Your AI Travel Companion',
    data: { name },
  });
}

export async function sendTripSharedEmail(to: string, tripName: string, sharedBy: string, shareUrl: string) {
  return sendTransactionalEmail({
    template: 'TripSharedEmail',
    to,
    subject: `${sharedBy} shared a trip with you on NovaTrek`,
    data: { tripName, sharedBy, shareUrl },
  });
}

export async function sendBookingConfirmationEmail(to: string, tripName: string, bookingDetails: React.ReactNode) {
  return sendTransactionalEmail({
    template: 'BookingConfirmationEmail',
    to,
    subject: `Booking Confirmed: ${tripName}`,
    data: { tripName, bookingDetails },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendTransactionalEmail({
    template: 'PasswordResetEmail',
    to,
    subject: 'Reset Your NovaTrek Password',
    data: { resetUrl },
  });
}

export async function sendSubscriptionConfirmationEmail(to: string, planName: string, features: string[]) {
  return sendTransactionalEmail({
    template: 'SubscriptionConfirmationEmail',
    to,
    subject: `Welcome to NovaTrek ${planName}!`,
    data: { planName, features },
  });
}