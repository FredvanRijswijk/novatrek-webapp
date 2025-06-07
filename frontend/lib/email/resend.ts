import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// For testing, use onboarding@resend.dev if custom domain is not verified
// Temporarily use Resend's test email until domain verification is resolved
export const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'; // process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
export const DEFAULT_REPLY_TO = process.env.RESEND_REPLY_TO || 'support@novatrek.app';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Try with custom domain first if configured
    const customFromEmail = process.env.RESEND_FROM_EMAIL;
    let fromEmail = DEFAULT_FROM_EMAIL;
    
    if (customFromEmail && customFromEmail !== 'onboarding@resend.dev') {
      try {
        const { data, error } = await resend.emails.send({
          from: customFromEmail,
          replyTo: options.replyTo || DEFAULT_REPLY_TO,
          ...options,
        });

        if (!error) {
          return data;
        }
        
        // If custom domain fails, fall back to Resend's test email
        console.warn('Custom domain failed, falling back to Resend test email:', error);
      } catch (customDomainError) {
        console.warn('Custom domain error, falling back to Resend test email:', customDomainError);
      }
    }

    // Use fallback email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      replyTo: options.replyTo || DEFAULT_REPLY_TO,
      ...options,
    });

    if (error) {
      console.error('Failed to send email with fallback:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}