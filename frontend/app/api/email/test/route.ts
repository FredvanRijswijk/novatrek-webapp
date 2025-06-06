import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmailServer } from '@/lib/email/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const name = searchParams.get('name') || 'Test User';

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const result = await sendWelcomeEmailServer(email, name);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      id: result?.id 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error?.message || error?.toString() || 'Unknown error',
      errorType: error?.name || 'UnknownError',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}