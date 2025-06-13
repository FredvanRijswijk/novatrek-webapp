# Slack Integration Guide for NovaTrek

This guide explains how to set up Slack notifications for user signups in NovaTrek.

## Prerequisites

- Admin access to your Slack workspace
- Access to NovaTrek's environment variables
- Basic understanding of webhooks

## Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app details:
   - App Name: `NovaTrek Notifications`
   - Pick a workspace: Select your workspace
   - Click **"Create App"**

## Step 2: Enable Incoming Webhooks

1. In your app's settings, go to **"Features"** → **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to ON
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want notifications (e.g., `#signups` or `#general`)
5. Click **"Allow"**
6. Copy the Webhook URL (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

## Step 3: Add Webhook URL to Environment Variables

Add the webhook URL to your `.env.local` file:

```env
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
SLACK_NOTIFICATIONS_ENABLED=true  # Toggle notifications on/off
```

**Important Note**: The channel is now permanently set when you create the webhook. You cannot override it via the API.

## Step 4: Test Your Webhook

Test the webhook using curl:

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message from NovaTrek!"}' \
  https://hooks.slack.com/services/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
```

## Message Formatting Options

**Important**: The `text` field is now required in all messages as a fallback for notifications.

### Basic Text Message
```json
{
  "text": "New user signed up: john@example.com"
}
```

### Rich Message with Blocks
```json
{
  "text": "New user signup: john@example.com",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "🎉 *New User Signup*"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Email:*\njohn@example.com"
        },
        {
          "type": "mrkdwn",
          "text": "*Sign-up Date:*\n2025-01-13"
        }
      ]
    }
  ]
}
```

### With User Avatar and Actions
```json
{
  "text": "New NovaTrek User: John Doe",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "🚀 *New NovaTrek User*"
      },
      "accessory": {
        "type": "image",
        "image_url": "https://api.dicebear.com/7.x/initials/svg?seed=JD",
        "alt_text": "user avatar"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Name:*\nJohn Doe"
        },
        {
          "type": "mrkdwn",
          "text": "*Email:*\njohn@example.com"
        },
        {
          "type": "mrkdwn",
          "text": "*Provider:*\nGoogle"
        },
        {
          "type": "mrkdwn",
          "text": "*Time:*\n<!date^1234567890^{date_pretty} at {time}|Jan 13, 2025>"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View in Dashboard"
          },
          "url": "https://novatrek.app/dashboard/admin/users"
        }
      ]
    }
  ]
}
```

## Security Best Practices

1. **Never expose your webhook URL in client-side code**
2. **Use environment variables** for all sensitive data
3. **Validate input** before sending to Slack
4. **Rate limit** notifications to prevent spam
5. **Log failures** for debugging

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check if the webhook URL is correct and not expired
2. **404 Not Found**: Verify the webhook URL format
3. **No messages appearing**: Check if the channel is correct and the app has permissions
4. **Rate limiting**: Slack limits to 1 message per second per webhook

### Debug Tips

- Check Next.js logs for API errors
- Use Slack's Block Kit Builder: [app.slack.com/block-kit-builder](https://app.slack.com/block-kit-builder)
- Test webhooks with Postman or curl first
- Verify environment variables are loaded correctly

## Limitations

1. **No channel override**: Once a webhook is created for a specific channel, you cannot change it via the API
2. **No username/icon customization**: These are set at the app level and cannot be overridden per message
3. **Organization-ready apps**: Webhooks do not work with organization-ready Slack apps

## Additional Features to Consider

1. **Different webhooks for different events**: Since you can't override channels, create separate webhooks:
   - Webhook 1: `#signups` for new users
   - Webhook 2: `#upgrades` for subscription changes
   - Webhook 3: `#errors` for system alerts

2. **User segments**:
   - Notify when premium users sign up
   - Alert for users from specific regions
   - Track referral sources

3. **Rich notifications**:
   - Include user's first trip destination
   - Show subscription tier
   - Add engagement metrics

## Rate Limits and Best Practices

- Slack rate limit: 1 message per second per webhook
- Batch notifications if needed
- Use threads for related messages
- Consider using Slack's Web API for more complex integrations

## Next Steps

1. Create dedicated channels for different notification types
2. Set up monitoring for failed notifications
3. Consider implementing a notification queue for reliability
4. Add notification preferences for different team members