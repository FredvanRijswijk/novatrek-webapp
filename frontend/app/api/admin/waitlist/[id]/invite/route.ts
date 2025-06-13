import { NextRequest, NextResponse } from 'next/server';
import { WaitlistModel } from '@/lib/models/waitlist-model';
import { verifyToken } from '@/lib/firebase/auth-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const waitlistModel = new WaitlistModel();
    
    // Get the entry to send email
    const entry = await waitlistModel.getById(params.id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update status to invited
    await waitlistModel.inviteUser(params.id);

    // Send invitation email
    try {
      const { sendWaitlistInvitationEmail } = await import('@/lib/email/waitlist-emails');
      await sendWaitlistInvitationEmail({
        email: entry.email,
        name: entry.name,
      });
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation sent successfully',
      email: entry.email 
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}