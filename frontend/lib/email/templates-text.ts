// Plain text versions of email templates

export function WelcomeEmailText({ name }: { name?: string }) {
  return `Welcome to NovaTrek${name ? `, ${name}` : ''}!

We're thrilled to have you join our community of travelers. NovaTrek is your personal AI-powered travel assistant, designed to make trip planning effortless and enjoyable.

Here's what you can do with NovaTrek:
• Plan multi-destination trips with ease
• Get personalized recommendations based on your preferences
• Build day-by-day itineraries
• Collaborate with travel companions
• Access your plans from anywhere

Start Planning Your First Trip:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips/new

Happy travels,
The NovaTrek Team`;
}

export function TripSharedEmailText({ tripName, sharedBy, shareUrl }: any) {
  return `A trip has been shared with you!

${sharedBy} has shared their trip "${tripName}" with you on NovaTrek.

View the trip details, itinerary, and planned activities here:
${shareUrl}

Safe travels,
The NovaTrek Team`;
}

export function BookingConfirmationEmailText({ tripName, bookingDetails }: any) {
  return `Booking Confirmed!

Great news! Your booking for "${tripName}" has been confirmed.

Booking Details:
${bookingDetails}

You can view and manage your booking in your NovaTrek dashboard:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips

Happy travels,
The NovaTrek Team`;
}

export function PasswordResetEmailText({ resetUrl }: any) {
  return `Reset Your Password

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.

The NovaTrek Team`;
}

export function SubscriptionConfirmationEmailText({ planName, features }: any) {
  const featuresList = features?.map((f: string) => `• ${f}`).join('\n') || '';
  
  return `Welcome to NovaTrek ${planName}!

Thank you for upgrading your account. You now have access to all the premium features.

Your ${planName} Features:
${featuresList}

Manage your subscription:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/settings/billing

Thank you for your support,
The NovaTrek Team`;
}

// Marketplace Expert Email Templates (Text)

export function ExpertApplicationReceivedEmailText({ businessName, email }: any) {
  return `Application Received!

Thank you for applying to become a NovaTrek Travel Expert. We've received your application for ${businessName}.

Our team will review your application within 2-3 business days. We'll evaluate:
• Your experience and qualifications
• The quality of your portfolio
• Your proposed services and pricing
• Alignment with NovaTrek's community standards

We'll send you an email at ${email} once we've made a decision.

Best regards,
The NovaTrek Marketplace Team`;
}

export function ExpertApplicationApprovedEmailText({ businessName, name }: any) {
  return `🎉 Congratulations, ${name}!

Great news! Your application to become a NovaTrek Travel Expert has been APPROVED.

${businessName} is now ready to join our marketplace. The next step is to complete your onboarding:

Next Steps:
1. Complete Stripe Connect onboarding for payments
2. Set up your expert profile
3. List your first products or services
4. Start earning from your travel expertise!

Complete your onboarding:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/expert/onboarding

Welcome to the NovaTrek expert community! We're excited to have you share your travel expertise with our users.

Welcome aboard,
The NovaTrek Marketplace Team`;
}

export function ExpertApplicationRejectedEmailText({ businessName, name, reason }: any) {
  return `Application Update

Dear ${name},

Thank you for your interest in becoming a NovaTrek Travel Expert. After careful review of your application for ${businessName}, we've decided not to move forward at this time.

${reason ? `Feedback:\n${reason}\n\n` : ''}We encourage you to address the feedback above and reapply in the future. The travel industry is constantly evolving, and we'd love to reconsider your application once you've had time to develop your expertise further.

Return to Dashboard:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard

Best wishes,
The NovaTrek Marketplace Team`;
}

export function ExpertApplicationNeedsInfoEmailText({ businessName, name, infoNeeded }: any) {
  return `Additional Information Required

Hi ${name},

We're reviewing your application for ${businessName} and need some additional information to proceed.

Information Needed:
${infoNeeded}

Please provide this information as soon as possible so we can continue reviewing your application. You can reply directly to this email with the requested details.

View your application:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/become-expert

Thank you,
The NovaTrek Marketplace Team`;
}

export function ExpertNewOrderEmailText({ expertName, orderDetails, customerName, amount }: any) {
  return `New Order Received! 🎉

Hi ${expertName},

Great news! You've received a new order from ${customerName}.

Order Details:
${orderDetails}

Total: $${amount}

Please reach out to your customer promptly to begin delivering your service. Remember to maintain excellent communication throughout the process.

View order details:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/expert

Happy selling,
The NovaTrek Marketplace Team`;
}

// Subscription Lifecycle Email Templates (Text)

export function SubscriptionTrialEndingEmailText({ name, daysLeft, planName }: any) {
  return `Your Trial is Ending Soon

Hi ${name},

Your NovaTrek ${planName} trial will end in ${daysLeft} days. We hope you've been enjoying all the premium features!

Don't lose access to:
• Unlimited trip planning
• AI-powered recommendations
• Multi-destination itineraries
• Group travel features
• Priority support

Continue your subscription to keep all your trips and preferences. Your payment method will be charged automatically when the trial ends.

Manage your subscription:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/settings/billing

Happy planning,
The NovaTrek Team`;
}

export function PaymentFailedEmailText({ name, planName, retryUrl }: any) {
  return `Payment Failed

Hi ${name},

We were unable to process your payment for your NovaTrek ${planName} subscription. This might be due to:
• Insufficient funds
• Expired card
• Card declined by your bank
• Outdated payment information

ACTION REQUIRED
Please update your payment method within 7 days to avoid service interruption.

Update payment method:
${retryUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/settings/billing`}

Need help? Reply to this email or contact support@novatrek.app
The NovaTrek Team`;
}

export function SubscriptionRenewalEmailText({ name, planName, amount, renewalDate }: any) {
  return `Subscription Renewal Notice

Hi ${name},

This is a friendly reminder that your NovaTrek ${planName} subscription will automatically renew on ${renewalDate}.

Renewal Details:
Plan: ${planName}
Amount: $${amount}
Renewal Date: ${renewalDate}

No action is needed if you'd like to continue enjoying NovaTrek. Your payment method on file will be charged automatically.

If you'd like to cancel or change your plan, you can do so anytime from your account settings.

Manage subscription:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/settings/billing

Thank you for being a valued member,
The NovaTrek Team`;
}

export function SubscriptionCancelledEmailText({ name }: any) {
  return `Subscription Cancelled

Hi ${name},

Your NovaTrek subscription has been cancelled. You'll continue to have access to premium features until the end of your current billing period.

We'd love to hear why you decided to cancel. Your feedback helps us improve NovaTrek for all travelers.

You'll always have access to:
• Your saved trips and itineraries
• Basic trip planning features
• Your travel preferences
• Previously shared trips

Changed your mind? You can reactivate your subscription anytime.

View plans:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/pricing

Safe travels,
The NovaTrek Team`;
}

// Trip Reminder Email Templates (Text)

export function TripReminderEmailText({ name, tripName, daysUntil, destination, startDate }: any) {
  const isOneDayReminder = daysUntil === 1;
  
  if (isOneDayReminder) {
    return `Pack Your Bags! 🎒

Hi ${name},

Your trip "${tripName}" to ${destination} starts tomorrow!

Trip Details:
Destination: ${destination}
Start Date: ${startDate}
Status: Ready to go! ✈️

Last-minute checklist:
✓ Check-in for flights
✓ Confirm accommodations
✓ Review your itinerary
✓ Check weather forecast
✓ Charge your devices
✓ Prepare travel documents

View trip details:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips

Have a wonderful trip!
The NovaTrek Team`;
  } else {
    return `Trip Reminder 📅

Hi ${name},

Just ${daysUntil} days until your trip "${tripName}" to ${destination}!

Trip Details:
Destination: ${destination}
Start Date: ${startDate}
Status: Ready to go! ✈️

Now's a great time to finalize your plans, check your packing list, and make any last-minute adjustments to your itinerary.

View trip details:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips

Have a wonderful trip!
The NovaTrek Team`;
  }
}

export function TripFeedbackEmailText({ name, tripName, destination }: any) {
  return `Welcome Back! 🏠

Hi ${name},

We hope you had an amazing time in ${destination}! Your trip "${tripName}" has ended, and we'd love to hear about your experience.

Share Your Experience:
• How was your itinerary?
• Did you discover any hidden gems?
• Any tips for future travelers?
• Upload your favorite photos!

Your feedback helps us improve trip recommendations for you and fellow travelers.

Share feedback:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/trips

Already planning your next adventure?
The NovaTrek Team`;
}

// Buyer Order Confirmation Email (Text)

export function BuyerOrderConfirmationEmailText({ buyerName, productName, expertName, amount, orderDate }: any) {
  const orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
  
  return `Order Confirmed! ✅

Hi ${buyerName},

Thank you for your purchase! Your order for ${productName} from ${expertName} has been confirmed.

Order Details:
Product: ${productName}
Expert: ${expertName}
Amount: $${amount}
Order Date: ${orderDate}
Order ID: #${orderId}

What happens next?
${expertName} will contact you within 24 hours to begin delivering your service. Please check your email for their message.

View order:
${process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'}/dashboard/purchases

Questions? Contact support@novatrek.app
The NovaTrek Team`;
}

// Email Verification Template (Text)

export function EmailVerificationEmailText({ verificationUrl }: any) {
  return `Verify Your Email

Welcome to NovaTrek! Please verify your email address to complete your registration and access all features.

Verify your email:
${verificationUrl}

If you didn't create a NovaTrek account, you can safely ignore this email.

This link will expire in 24 hours for security reasons.

The NovaTrek Team`;
}