import { User } from 'firebase/auth';
import { WaitlistModel } from '@/lib/models/waitlist-model';

export async function checkWaitlistAccess(user: User): Promise<{
  hasAccess: boolean;
  waitlistStatus?: 'pending' | 'approved' | 'invited' | 'joined';
  message?: string;
}> {
  if (!user?.email) {
    return { hasAccess: false, message: 'No email associated with account' };
  }

  const waitlistModel = new WaitlistModel();
  const entry = await waitlistModel.getByEmail(user.email);

  // If not on waitlist at all, check if this is a special case
  if (!entry) {
    // You might want to auto-add certain domains or admin users
    if (user.email.endsWith('@novatrek.com')) {
      return { hasAccess: true };
    }
    
    // Add to waitlist automatically
    try {
      await waitlistModel.addToWaitlist({
        email: user.email,
        name: user.displayName || undefined,
        metadata: {
          userAgent: navigator.userAgent,
        }
      });
      return { 
        hasAccess: false, 
        waitlistStatus: 'pending',
        message: 'You've been added to the waitlist. We'll notify you when you can access NovaTrek.' 
      };
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return { 
        hasAccess: false, 
        message: 'Error processing waitlist status. Please try again.' 
      };
    }
  }

  // Check waitlist status
  switch (entry.status) {
    case 'joined':
      return { hasAccess: true, waitlistStatus: entry.status };
    
    case 'invited':
      // Mark as joined when they sign in
      await waitlistModel.markAsJoined(user.email);
      return { hasAccess: true, waitlistStatus: 'joined' };
    
    case 'approved':
      return { 
        hasAccess: false, 
        waitlistStatus: entry.status,
        message: 'Your application has been approved! You'll receive an invitation soon.' 
      };
    
    case 'pending':
    default:
      return { 
        hasAccess: false, 
        waitlistStatus: entry.status,
        message: `You're #${entry.position} on the waitlist. We'll notify you when it's your turn!` 
      };
  }
}