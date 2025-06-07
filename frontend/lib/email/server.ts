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

// Marketplace Expert Email Functions

export async function sendExpertApplicationReceivedEmailServer(
  to: string,
  businessName: string
) {
  const html = await renderEmailTemplate(templates.ExpertApplicationReceivedEmail, {
    businessName,
    email: to,
  });
  const text = textTemplates.ExpertApplicationReceivedEmailText({ businessName, email: to });
  
  return sendEmail({
    to,
    subject: 'Your NovaTrek Expert Application Has Been Received',
    html,
    text,
  });
}

export async function sendExpertApplicationApprovedEmailServer(
  to: string,
  name: string,
  businessName: string
) {
  const html = await renderEmailTemplate(templates.ExpertApplicationApprovedEmail, {
    name,
    businessName,
  });
  const text = textTemplates.ExpertApplicationApprovedEmailText({ name, businessName });
  
  return sendEmail({
    to,
    subject: 'Congratulations! Your NovaTrek Expert Application is Approved',
    html,
    text,
  });
}

export async function sendExpertApplicationRejectedEmailServer(
  to: string,
  name: string,
  businessName: string,
  reason?: string
) {
  const html = await renderEmailTemplate(templates.ExpertApplicationRejectedEmail, {
    name,
    businessName,
    reason,
  });
  const text = textTemplates.ExpertApplicationRejectedEmailText({ name, businessName, reason });
  
  return sendEmail({
    to,
    subject: 'Update on Your NovaTrek Expert Application',
    html,
    text,
  });
}

export async function sendExpertApplicationNeedsInfoEmailServer(
  to: string,
  name: string,
  businessName: string,
  infoNeeded: string
) {
  const html = await renderEmailTemplate(templates.ExpertApplicationNeedsInfoEmail, {
    name,
    businessName,
    infoNeeded,
  });
  const text = textTemplates.ExpertApplicationNeedsInfoEmailText({ name, businessName, infoNeeded });
  
  return sendEmail({
    to,
    subject: 'Additional Information Required for Your NovaTrek Expert Application',
    html,
    text,
  });
}

export async function sendExpertNewOrderEmailServer(
  to: string,
  expertName: string,
  orderDetails: string,
  customerName: string,
  amount: string
) {
  const html = await renderEmailTemplate(templates.ExpertNewOrderEmail, {
    expertName,
    orderDetails,
    customerName,
    amount,
  });
  const text = textTemplates.ExpertNewOrderEmailText({ expertName, orderDetails, customerName, amount });
  
  return sendEmail({
    to,
    subject: `New Order Received - $${amount}`,
    html,
    text,
  });
}

// Subscription Lifecycle Email Functions

export async function sendSubscriptionTrialEndingEmailServer(
  to: string,
  name: string,
  daysLeft: number,
  planName: string
) {
  const html = await renderEmailTemplate(templates.SubscriptionTrialEndingEmail, {
    name,
    daysLeft,
    planName,
  });
  const text = textTemplates.SubscriptionTrialEndingEmailText({ name, daysLeft, planName });
  
  return sendEmail({
    to,
    subject: `Your NovaTrek trial ends in ${daysLeft} days`,
    html,
    text,
  });
}

export async function sendPaymentFailedEmailServer(
  to: string,
  name: string,
  planName: string,
  retryUrl?: string
) {
  const html = await renderEmailTemplate(templates.PaymentFailedEmail, {
    name,
    planName,
    retryUrl,
  });
  const text = textTemplates.PaymentFailedEmailText({ name, planName, retryUrl });
  
  return sendEmail({
    to,
    subject: 'Action Required: Payment Failed for Your NovaTrek Subscription',
    html,
    text,
  });
}

export async function sendSubscriptionRenewalEmailServer(
  to: string,
  name: string,
  planName: string,
  amount: string,
  renewalDate: string
) {
  const html = await renderEmailTemplate(templates.SubscriptionRenewalEmail, {
    name,
    planName,
    amount,
    renewalDate,
  });
  const text = textTemplates.SubscriptionRenewalEmailText({ name, planName, amount, renewalDate });
  
  return sendEmail({
    to,
    subject: `Your NovaTrek subscription will renew on ${renewalDate}`,
    html,
    text,
  });
}

export async function sendSubscriptionCancelledEmailServer(
  to: string,
  name: string
) {
  const html = await renderEmailTemplate(templates.SubscriptionCancelledEmail, {
    name,
  });
  const text = textTemplates.SubscriptionCancelledEmailText({ name });
  
  return sendEmail({
    to,
    subject: `We're sorry to see you go`,
    html,
    text,
  });
}

// Trip Reminder Email Functions

export async function sendTripReminderEmailServer(
  to: string,
  name: string,
  tripName: string,
  daysUntil: number,
  destination: string,
  startDate: string
) {
  const isOneDayReminder = daysUntil === 1;
  const subject = isOneDayReminder 
    ? `Tomorrow: Your trip to ${destination}!` 
    : `${daysUntil} days until your trip to ${destination}`;

  const html = await renderEmailTemplate(templates.TripReminderEmail, {
    name,
    tripName,
    daysUntil,
    destination,
    startDate,
  });
  const text = textTemplates.TripReminderEmailText({ name, tripName, daysUntil, destination, startDate });
  
  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

export async function sendTripFeedbackEmailServer(
  to: string,
  name: string,
  tripName: string,
  destination: string
) {
  const html = await renderEmailTemplate(templates.TripFeedbackEmail, {
    name,
    tripName,
    destination,
  });
  const text = textTemplates.TripFeedbackEmailText({ name, tripName, destination });
  
  return sendEmail({
    to,
    subject: `How was your trip to ${destination}?`,
    html,
    text,
  });
}

// Buyer Order Email Functions

export async function sendBuyerOrderConfirmationEmailServer(
  to: string,
  buyerName: string,
  productName: string,
  expertName: string,
  amount: string,
  orderDate: string
) {
  const html = await renderEmailTemplate(templates.BuyerOrderConfirmationEmail, {
    buyerName,
    productName,
    expertName,
    amount,
    orderDate,
  });
  const text = textTemplates.BuyerOrderConfirmationEmailText({ 
    buyerName, 
    productName, 
    expertName, 
    amount, 
    orderDate 
  });
  
  return sendEmail({
    to,
    subject: `Order Confirmed: ${productName}`,
    html,
    text,
  });
}

// Email Verification Function

export async function sendEmailVerificationEmailServer(
  to: string,
  verificationUrl: string
) {
  const html = await renderEmailTemplate(templates.EmailVerificationEmail, {
    verificationUrl,
  });
  const text = textTemplates.EmailVerificationEmailText({ verificationUrl });
  
  return sendEmail({
    to,
    subject: 'Verify your NovaTrek email address',
    html,
    text,
  });
}