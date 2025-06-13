import { resend } from '@/lib/email/resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text, replyTo } = options;

  try {
    const result = await resend.emails.send({
      from: 'NovaTrek <info@send.novatrek.app>',
      to,
      subject,
      html,
      text,
      replyTo: replyTo || 'support@novatrek.app',
    });

    console.log(`Email sent successfully to ${to}`, result);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log the email that would have been sent
    console.log('Email that would have been sent:', {
      to,
      subject,
      preview: text.substring(0, 200) + '...',
    });
    
    return false;
  }
}

