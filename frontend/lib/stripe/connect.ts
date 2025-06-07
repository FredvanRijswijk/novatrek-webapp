import { stripe } from './config'
import type { Stripe } from 'stripe'

// Platform configuration
export const PLATFORM_FEE_PERCENTAGE = 0.15 // 15% platform fee
export const MINIMUM_PLATFORM_FEE = 100 // $1.00 minimum fee in cents

/**
 * Create a Stripe Connect account for a travel expert
 */
export async function createConnectAccount(email: string, businessName?: string): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US', // TODO: Make this dynamic based on user location
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual', // Can be 'company' for businesses
    business_profile: {
      name: businessName,
      product_description: 'Travel planning services and trip templates',
    },
  })

  return account
}

/**
 * Generate an account link for Connect onboarding
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink
}

/**
 * Create a login link for the Express dashboard
 */
export async function createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
  const loginLink = await stripe.accounts.createLoginLink(accountId)
  return loginLink
}

/**
 * Retrieve Connect account details
 */
export async function getConnectAccount(accountId: string): Promise<Stripe.Account> {
  const account = await stripe.accounts.retrieve(accountId)
  return account
}

/**
 * Check if a Connect account has completed onboarding
 */
export async function isAccountOnboarded(accountId: string): Promise<boolean> {
  const account = await getConnectAccount(accountId)
  return account.charges_enabled && account.payouts_enabled
}

/**
 * Calculate platform fee for a given amount
 */
export function calculatePlatformFee(amount: number): number {
  const calculatedFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE)
  return Math.max(calculatedFee, MINIMUM_PLATFORM_FEE)
}

/**
 * Create a payment intent with Connect platform fee
 */
export async function createConnectPaymentIntent(
  amount: number,
  currency: string,
  connectedAccountId: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const platformFee = calculatePlatformFee(amount)
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    application_fee_amount: platformFee,
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata: {
      platform_fee: platformFee.toString(),
      seller_earnings: (amount - platformFee).toString(),
      ...metadata,
    },
  })

  return paymentIntent
}

/**
 * Create a refund for a Connect payment
 */
export async function createConnectRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // If not specified, refunds the full amount
    reason: reason as Stripe.RefundCreateParams.Reason,
    refund_application_fee: true, // Refund the platform fee as well
  })

  return refund
}

/**
 * Update payout schedule for a Connect account
 */
export async function updatePayoutSchedule(
  accountId: string,
  interval: 'daily' | 'weekly' | 'monthly'
): Promise<Stripe.Account> {
  const delayDays = interval === 'daily' ? 2 : interval === 'weekly' ? 7 : 30
  
  const account = await stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          interval,
          delay_days: delayDays,
        },
      },
    },
  })

  return account
}

/**
 * Get balance for a Connect account
 */
export async function getConnectBalance(accountId: string): Promise<Stripe.Balance> {
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  })
  
  return balance
}

/**
 * List transactions for a Connect account
 */
export async function listConnectTransactions(
  accountId: string,
  limit = 10
): Promise<Stripe.BalanceTransaction[]> {
  const transactions = await stripe.balanceTransactions.list(
    {
      limit,
    },
    {
      stripeAccount: accountId,
    }
  )
  
  return transactions.data
}

/**
 * Create a payout for a Connect account
 */
export async function createPayout(
  accountId: string,
  amount: number,
  currency: string
): Promise<Stripe.Payout> {
  const payout = await stripe.payouts.create(
    {
      amount,
      currency,
    },
    {
      stripeAccount: accountId,
    }
  )
  
  return payout
}

/**
 * Handle Connect webhooks
 */
export async function handleConnectWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; message?: string }> {
  switch (event.type) {
    case 'account.updated':
      // Handle account updates (e.g., onboarding completion)
      const account = event.data.object as Stripe.Account
      console.log('Connect account updated:', account.id)
      // TODO: Update database with account status
      break

    case 'account.application.deauthorized':
      // Handle account disconnection
      const deauthorized = event.data.object as Stripe.Account
      console.log('Connect account deauthorized:', deauthorized.id)
      // TODO: Update database to mark account as inactive
      break

    case 'payment_intent.succeeded':
      // Handle successful payment with Connect
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      if (paymentIntent.transfer_data) {
        console.log('Connect payment succeeded:', paymentIntent.id)
        // TODO: Update transaction status in database
      }
      break

    case 'transfer.created':
      // Handle transfer to connected account
      const transfer = event.data.object as Stripe.Transfer
      console.log('Transfer created:', transfer.id)
      // TODO: Record transfer in database
      break

    case 'payout.paid':
      // Handle successful payout to connected account
      const payout = event.data.object as Stripe.Payout
      console.log('Payout paid:', payout.id)
      // TODO: Update payout status in database
      break

    default:
      console.log('Unhandled Connect webhook event:', event.type)
  }

  return { success: true }
}