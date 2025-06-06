import { sendEmail } from './resend';
import { renderEmailTemplate } from './render';
import * as templates from './templates';
import * as textTemplates from './templates-text';

// Server-side email sending functions that don't require client authentication

export async function sendWelcomeEmailServer(to: string, name?: string) {
  const html = await renderEmailTemplate(templates.WelcomeEmail, { name });
  const text = textTemplates.WelcomeEmailText({ name });
  
  return sendEmail({
    to,
    subject: 'Welcome to NovaTrek - Your AI Travel Companion',
    html,
    text,
  });
}

export async function sendPasswordResetEmailServer(to: string, resetUrl: string) {
  const html = await renderEmailTemplate(templates.PasswordResetEmail, { resetUrl });
  const text = textTemplates.PasswordResetEmailText({ resetUrl });
  
  return sendEmail({
    to,
    subject: 'Reset Your NovaTrek Password',
    html,
    text,
  });
}

export async function sendSubscriptionConfirmationEmailServer(
  to: string, 
  planName: string, 
  features: string[]
) {
  const html = await renderEmailTemplate(templates.SubscriptionConfirmationEmail, { 
    planName, 
    features 
  });
  const text = textTemplates.SubscriptionConfirmationEmailText({ planName, features });
  
  return sendEmail({
    to,
    subject: `Welcome to NovaTrek ${planName}!`,
    html,
    text,
  });
}

export async function sendTripSharedEmailServer(
  to: string,
  tripName: string,
  sharedBy: string,
  shareUrl: string
) {
  const html = await renderEmailTemplate(templates.TripSharedEmail, {
    tripName,
    sharedBy,
    shareUrl,
  });
  const text = textTemplates.TripSharedEmailText({ tripName, sharedBy, shareUrl });
  
  return sendEmail({
    to,
    subject: `${sharedBy} shared a trip with you on NovaTrek`,
    html,
    text,
  });
}