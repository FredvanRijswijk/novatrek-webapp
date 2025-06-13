import { NextRequest, NextResponse } from 'next/server';

// Types for Slack message formatting
interface SlackField {
  type: 'mrkdwn' | 'plain_text';
  text: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: SlackField[];
  accessory?: {
    type: string;
    image_url: string;
    alt_text: string;
  };
  elements?: Array<{
    type: string;
    text: {
      type: string;
      text: string;
    };
    url?: string;
  }>;
}

interface SlackMessage {
  text: string; // Required field
  blocks?: SlackBlock[];
  // Note: channel, username, and icon_emoji/icon_url are no longer supported
}

interface NotificationPayload {
  type: 'user_signup' | 'subscription_upgrade' | 'trip_created' | 'waitlist_signup' | 'custom';
  data: {
    email?: string;
    name?: string;
    provider?: string;
    userId?: string;
    customMessage?: string;
    metadata?: Record<string, any>;
  };
}

// Helper function to format timestamps for Slack
function formatSlackTimestamp(date: Date): string {
  const timestamp = Math.floor(date.getTime() / 1000);
  return `<!date^${timestamp}^{date_pretty} at {time}|${date.toISOString()}>`;
}

// Helper function to create user avatar URL
function getUserAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=1e40af&textColor=ffffff`;
}

// Main notification handler
async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const isEnabled = process.env.SLACK_NOTIFICATIONS_ENABLED === 'true';

  if (!webhookUrl || !isEnabled) {
    console.log('Slack notifications disabled or webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

// Message builders for different notification types
function buildUserSignupMessage(data: NotificationPayload['data']): SlackMessage {
  const { email, name, provider, userId } = data;
  const timestamp = formatSlackTimestamp(new Date());
  
  return {
    text: `New user signup: ${email}`, // Required fallback text
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🎉 *New User Signup*',
        },
        accessory: name ? {
          type: 'image',
          image_url: getUserAvatar(name),
          alt_text: 'user avatar',
        } : undefined,
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${name || 'Not provided'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Provider:*\n${provider || 'Email/Password'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${timestamp}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View User',
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/users?userId=${userId}`,
          },
        ],
      },
    ],
  };
}

function buildSubscriptionUpgradeMessage(data: NotificationPayload['data']): SlackMessage {
  const { email, name, metadata } = data;
  const timestamp = formatSlackTimestamp(new Date());
  
  return {
    text: `Subscription upgrade: ${name || email} to ${metadata?.plan || 'Premium'}`, // Required fallback text
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '💎 *Subscription Upgrade*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*User:*\n${name || email}`,
          },
          {
            type: 'mrkdwn',
            text: `*New Plan:*\n${metadata?.plan || 'Premium'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Amount:*\n$${metadata?.amount || '0'}/month`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${timestamp}`,
          },
        ],
      },
    ],
  };
}

function buildTripCreatedMessage(data: NotificationPayload['data']): SlackMessage {
  const { email, name, metadata } = data;
  const timestamp = formatSlackTimestamp(new Date());
  
  return {
    text: `New trip created: ${metadata?.destination || 'Unknown'} by ${name || email}`, // Required fallback text
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✈️ *New Trip Created*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*User:*\n${name || email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Destination:*\n${metadata?.destination || 'Unknown'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${metadata?.duration || '0'} days`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${timestamp}`,
          },
        ],
      },
    ],
  };
}

function buildWaitlistSignupMessage(data: NotificationPayload['data']): SlackMessage {
  const { email, name, metadata } = data;
  const timestamp = formatSlackTimestamp(new Date());
  
  // Format interests array
  const interests = metadata?.interests?.join(', ') || 'None specified';
  const referralSource = metadata?.referralSource || 'Not specified';
  
  return {
    text: `New waitlist signup: ${email} (#${metadata?.position || 'unknown'})`, // Required fallback text
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🚀 *New Waitlist Signup*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Email:*\n${email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Name:*\n${name || 'Not provided'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Position:*\n#${metadata?.position || 'unknown'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Referral:*\n${referralSource}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Interests:* ${interests}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Signed up at ${timestamp}`,
          },
        ],
      },
    ],
  };
}

function buildCustomMessage(data: NotificationPayload['data']): SlackMessage {
  return {
    text: data.customMessage || 'Custom notification from NovaTrek',
  };
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json();

    // Validate payload
    if (!payload.type || !payload.data) {
      return NextResponse.json(
        { error: 'Invalid payload: missing type or data' },
        { status: 400 }
      );
    }

    // Build message based on notification type
    let message: SlackMessage;
    switch (payload.type) {
      case 'user_signup':
        message = buildUserSignupMessage(payload.data);
        break;
      case 'subscription_upgrade':
        message = buildSubscriptionUpgradeMessage(payload.data);
        break;
      case 'trip_created':
        message = buildTripCreatedMessage(payload.data);
        break;
      case 'waitlist_signup':
        message = buildWaitlistSignupMessage(payload.data);
        break;
      case 'custom':
        message = buildCustomMessage(payload.data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    // Note: Channel override is no longer supported by Slack webhooks
    // The webhook will always post to the channel configured during setup

    // Send notification
    const success = await sendSlackNotification(message);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const isEnabled = process.env.SLACK_NOTIFICATIONS_ENABLED === 'true';
  const hasWebhook = !!process.env.SLACK_WEBHOOK_URL;

  return NextResponse.json({
    enabled: isEnabled,
    configured: hasWebhook,
    // Note: Channel is configured during webhook creation, not via API
  });
}