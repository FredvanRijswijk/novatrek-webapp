import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { renderEmailTemplate } from '@/lib/email/render';
import * as templates from '@/lib/email/templates';
import * as textTemplates from '@/lib/email/templates-text';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { template, to, subject, data, replyTo } = body;

    // Validate required fields
    if (!template || !to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: template, to, subject' },
        { status: 400 }
      );
    }

    // Get the template components
    const TemplateComponent = (templates as any)[template];
    const TextTemplateFunction = (textTemplates as any)[`${template}Text`];
    
    if (!TemplateComponent) {
      return NextResponse.json(
        { error: `Template "${template}" not found` },
        { status: 400 }
      );
    }

    // Render the email template
    const html = await renderEmailTemplate(TemplateComponent, data);
    const text = TextTemplateFunction ? TextTemplateFunction(data) : undefined;

    // Send the email
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      replyTo,
    });

    return NextResponse.json({ success: true, id: result?.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}