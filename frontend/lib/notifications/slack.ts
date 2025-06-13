/**
 * Slack notification utilities
 */

interface SlackNotificationData {
  email: string;
  name?: string;
  provider?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 'user_signup' | 'subscription_upgrade' | 'trip_created' | 'custom';

/**
 * Send a notification to Slack
 */
export async function sendSlackNotification(
  type: NotificationType,
  data: SlackNotificationData
): Promise<boolean> {
  try {
    // Only send notifications in production or if explicitly enabled
    const isProduction = process.env.NODE_ENV === 'production';
    const isEnabled = process.env.SLACK_NOTIFICATIONS_ENABLED === 'true';
    
    if (!isProduction && !isEnabled) {
      console.log('Slack notification (dev mode):', { type, data });
      return true;
    }

    const response = await fetch('/api/notifications/slack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Slack notification failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    // Don't throw - we don't want notification failures to break the app
    return false;
  }
}

/**
 * Send a user signup notification
 */
export async function notifyUserSignup(user: {
  email: string;
  displayName?: string | null;
  uid: string;
  providerId?: string;
}) {
  return sendSlackNotification('user_signup', {
    email: user.email,
    name: user.displayName || undefined,
    provider: user.providerId,
    userId: user.uid,
  });
}

/**
 * Send a subscription upgrade notification
 */
export async function notifySubscriptionUpgrade(data: {
  email: string;
  name?: string;
  plan: string;
  amount: number;
  userId: string;
}) {
  return sendSlackNotification('subscription_upgrade', {
    email: data.email,
    name: data.name,
    userId: data.userId,
    metadata: {
      plan: data.plan,
      amount: data.amount,
    },
  });
}

/**
 * Send a trip created notification
 */
export async function notifyTripCreated(data: {
  email: string;
  name?: string;
  destination: string;
  duration: number;
  userId: string;
  tripId: string;
}) {
  return sendSlackNotification('trip_created', {
    email: data.email,
    name: data.name,
    userId: data.userId,
    metadata: {
      destination: data.destination,
      duration: data.duration,
      tripId: data.tripId,
    },
  });
}

/**
 * Send a custom notification
 */
export async function sendCustomNotification(message: string, data?: Record<string, any>) {
  return sendSlackNotification('custom', {
    email: 'system@novatrek.app',
    metadata: {
      customMessage: message,
      ...data,
    },
  });
}