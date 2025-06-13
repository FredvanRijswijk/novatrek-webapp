import { NextRequest, NextResponse } from 'next/server';
import { WaitlistModel } from '@/lib/models/waitlist-model';
import { verifyToken } from '@/lib/firebase/auth-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyToken(token);
    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { count = 10 } = await request.json();
    const waitlistModel = new WaitlistModel();

    // Get approved users who haven't been invited yet
    const approvedUsers = await waitlistModel.getWaitlistEntries('approved', count);
    
    let invited = 0;
    const errors: string[] = [];

    // Send invites to each approved user
    for (const user of approvedUsers.slice(0, count)) {
      try {
        await waitlistModel.inviteUser(user.id);
        
        // Send invitation email
        try {
          const { sendWaitlistInvitationEmail } = await import('@/lib/email/waitlist-emails');
          await sendWaitlistInvitationEmail({
            email: user.email,
            name: user.name,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
        
        invited++;
      } catch (error) {
        console.error(`Failed to invite ${user.email}:`, error);
        errors.push(user.email);
      }
    }

    return NextResponse.json({ 
      success: true,
      invited,
      total: approvedUsers.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully invited ${invited} users`
    });
  } catch (error) {
    console.error('Error sending bulk invites:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk invitations' },
      { status: 500 }
    );
  }
}