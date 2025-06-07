# NovaTrek Email Notification System

## Overview
This document outlines all transactional emails sent by the NovaTrek platform, when they're triggered, and their purpose.

## Email Categories

### 1. User Authentication & Account Management

#### Welcome Email ✅
- **Trigger**: New user registration
- **Template**: `WelcomeEmail`
- **Status**: Already implemented
- **Content**: Welcome message, getting started guide, key features

#### Email Verification (if enabled)
- **Trigger**: User signs up with email/password
- **Template**: `EmailVerificationEmail`
- **Status**: To implement
- **Content**: Verification link, security message

#### Password Reset ✅
- **Trigger**: User requests password reset
- **Template**: `PasswordResetEmail`
- **Status**: Already implemented
- **Content**: Reset link, security warning

#### Account Changes
- **Trigger**: Email/password change, account deletion
- **Template**: `AccountChangeEmail`
- **Status**: To implement
- **Content**: Change confirmation, security alert

### 2. Subscription Management

#### Subscription Confirmation ✅
- **Trigger**: User subscribes to a plan
- **Template**: `SubscriptionConfirmationEmail`
- **Status**: Already implemented
- **Content**: Plan details, features, billing info

#### Subscription Changes
- **Trigger**: Upgrade/downgrade/cancellation
- **Template**: `SubscriptionChangeEmail`
- **Status**: To implement
- **Content**: Change details, effective date, new features/limitations

#### Payment Issues
- **Trigger**: Payment failed, card expiring
- **Template**: `PaymentIssueEmail`
- **Status**: To implement
- **Content**: Issue description, update payment link

#### Trial/Renewal Reminders
- **Trigger**: 3 days before trial ends, 7 days before renewal
- **Template**: `SubscriptionReminderEmail`
- **Status**: To implement
- **Content**: Reminder, benefits, action required

### 3. Marketplace Expert Lifecycle

#### Application Received
- **Trigger**: User submits expert application
- **Template**: `ExpertApplicationReceivedEmail`
- **Status**: To implement
- **Content**: Confirmation, next steps, timeline

#### Application Status Updates
- **Trigger**: Application approved/rejected/needs info
- **Templates**: 
  - `ExpertApplicationApprovedEmail`
  - `ExpertApplicationRejectedEmail`
  - `ExpertApplicationNeedsInfoEmail`
- **Status**: To implement
- **Content**: Status, next steps, feedback

#### Expert Onboarding
- **Trigger**: Stripe Connect onboarding completed
- **Template**: `ExpertOnboardingCompleteEmail`
- **Status**: To implement
- **Content**: Congratulations, how to list products, best practices

#### Expert Operations
- **Trigger**: New order, payout, review received
- **Templates**:
  - `ExpertNewOrderEmail`
  - `ExpertPayoutEmail`
  - `ExpertNewReviewEmail`
- **Status**: To implement
- **Content**: Order/payout details, review content

### 4. Marketplace Buyer Notifications

#### Order Confirmation
- **Trigger**: User purchases from expert
- **Template**: `BuyerOrderConfirmationEmail`
- **Status**: To implement
- **Content**: Order details, expert contact, next steps

#### Order Updates
- **Trigger**: Order status changes
- **Template**: `BuyerOrderUpdateEmail`
- **Status**: To implement
- **Content**: Status update, tracking info

### 5. Trip & Travel Notifications

#### Trip Shared ✅
- **Trigger**: User shares trip with someone
- **Template**: `TripSharedEmail`
- **Status**: Already implemented
- **Content**: Trip details, share link, sender info

#### Trip Reminders
- **Trigger**: 7 days before trip, 1 day before
- **Template**: `TripReminderEmail`
- **Status**: To implement
- **Content**: Trip details, packing reminder, weather

#### Trip Feedback
- **Trigger**: 1 day after trip ends
- **Template**: `TripFeedbackEmail`
- **Status**: To implement
- **Content**: Request feedback, share photos prompt

### 6. Group Travel Notifications

#### Group Invitation
- **Trigger**: User invited to group trip
- **Template**: `GroupTripInvitationEmail`
- **Status**: To implement
- **Content**: Trip details, group members, accept link

#### Group Updates
- **Trigger**: Member joined, consensus reached
- **Template**: `GroupTripUpdateEmail`
- **Status**: To implement
- **Content**: Update details, current status

## Implementation Priority

### Phase 1 - Critical (Immediate)
1. Expert application status emails (approved/rejected/needs info)
2. Expert application received confirmation
3. Email verification (if enabling email/password auth)

### Phase 2 - Important (Next Sprint)
1. Subscription change notifications
2. Payment issue alerts
3. Expert operational emails (orders, payouts)
4. Buyer order confirmations

### Phase 3 - Nice to Have (Future)
1. Trip reminders
2. Trial/renewal reminders
3. Group travel notifications
4. Trip feedback requests

## Email Service Architecture

### Centralized Email Service
Location: `/lib/email/notification-service.ts`

```typescript
export class NotificationService {
  // User authentication emails
  static async sendWelcomeEmail(userId: string)
  static async sendEmailVerification(email: string, verificationUrl: string)
  static async sendPasswordReset(email: string, resetUrl: string)
  
  // Subscription emails
  static async sendSubscriptionConfirmation(userId: string, plan: SubscriptionPlan)
  static async sendSubscriptionChange(userId: string, change: SubscriptionChange)
  static async sendPaymentIssue(userId: string, issue: PaymentIssue)
  
  // Expert emails
  static async sendExpertApplicationReceived(applicationId: string)
  static async sendExpertApplicationStatus(applicationId: string, status: ApplicationStatus)
  static async sendExpertOnboardingComplete(expertId: string)
  static async sendExpertNewOrder(orderId: string)
  
  // Trip emails
  static async sendTripReminder(tripId: string, reminderType: 'week' | 'day')
  static async sendTripFeedback(tripId: string)
}
```

### Email Templates Location
- React components: `/lib/email/templates/`
- Text versions: `/lib/email/templates-text.ts`

### Webhook Integration Points
1. **Stripe webhooks** - Payment events, subscription changes
2. **Firebase Auth triggers** - User creation, deletion
3. **Firestore triggers** - Application status changes, order creation

## Testing Strategy

### Development
- Use Resend test email (onboarding@resend.dev)
- Test endpoint: `/api/email/test`
- Email preview in Resend dashboard

### Production
- Verified domain: send.novatrek.app
- Monitor delivery rates in Resend dashboard
- Set up bounce/complaint handling

## Security Considerations

1. **Rate Limiting** - Prevent email bombing
2. **Template Injection** - Sanitize all user inputs
3. **Unsubscribe Links** - Include in all marketing emails
4. **Privacy** - Don't expose sensitive data in emails

## Monitoring & Analytics

1. **Delivery Metrics** - Track open rates, click rates
2. **Error Handling** - Log failed sends, retry logic
3. **User Preferences** - Allow users to manage email preferences
4. **Compliance** - GDPR, CAN-SPAM compliance