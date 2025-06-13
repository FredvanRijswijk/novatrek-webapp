import { initAdmin } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Firebase Extensions (Trigger Email) or other service
 * This assumes you have the Firebase Trigger Email extension installed
 * https://extensions.dev/extensions/firebase/firestore-send-email
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text, from = 'NovaTrek <noreply@novatrek.com>', replyTo = 'support@novatrek.com' } = options;

  try {
    await initAdmin();
    const db = getFirestore();

    // Create email document for Firebase Trigger Email extension
    const emailData = {
      to,
      from,
      replyTo,
      message: {
        subject,
        html,
        text,
      },
      createdAt: new Date(),
    };

    // Add to mail collection (used by Firebase Email extension)
    await db.collection('mail').add(emailData);

    console.log(`Email queued for sending to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Fallback: You could integrate with SendGrid, AWS SES, or other services here
    // For now, we'll just log the error
    console.log('Email that would have been sent:', {
      to,
      subject,
      preview: text.substring(0, 200) + '...',
    });
    
    return false;
  }
}

/**
 * Send email using a third-party service (example with fetch)
 * This is a placeholder for services like SendGrid, Mailgun, etc.
 */
export async function sendEmailViaAPI(options: EmailOptions) {
  // Example implementation for SendGrid
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
        }],
        from: { email: 'noreply@novatrek.com', name: 'NovaTrek' },
        reply_to: { email: options.replyTo || 'support@novatrek.com' },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text },
          { type: 'text/html', value: options.html },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
}