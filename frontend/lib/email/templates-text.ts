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