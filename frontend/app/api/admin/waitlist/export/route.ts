import { NextRequest, NextResponse } from 'next/server';
import { WaitlistModel } from '@/lib/models/waitlist-model';
import { verifyToken } from '@/lib/firebase/auth-admin';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
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
    const entries = await waitlistModel.getWaitlistEntries();

    // Create CSV content
    const headers = [
      'Position',
      'Email',
      'Name',
      'Status',
      'Interests',
      'Referral Source',
      'Created At',
      'Approved At',
      'Invited At',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign'
    ];

    const rows = entries.map(entry => [
      entry.position || '',
      entry.email,
      entry.name || '',
      entry.status,
      entry.interests?.join('; ') || '',
      entry.referralSource || '',
      entry.createdAt ? format(entry.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
      entry.approvedAt ? format(entry.approvedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
      entry.invitedAt ? format(entry.invitedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
      entry.metadata?.utm_source || '',
      entry.metadata?.utm_medium || '',
      entry.metadata?.utm_campaign || ''
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="waitlist-${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to export waitlist' },
      { status: 500 }
    );
  }
}