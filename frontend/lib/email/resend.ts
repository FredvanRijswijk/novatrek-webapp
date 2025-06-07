import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified custom domain
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'info@send.novatrek.app';
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
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      replyTo: options.replyTo || DEFAULT_REPLY_TO,
      ...options,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}