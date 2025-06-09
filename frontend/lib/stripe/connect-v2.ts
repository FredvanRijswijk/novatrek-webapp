import { stripe } from './config'
import type { Stripe } from 'stripe'

// Platform configuration
export const PLATFORM_FEE_PERCENTAGE = 0.15 // 15% platform fee
export const MINIMUM_PLATFORM_FEE = 100 // $1.00 minimum fee in cents

/**
 * Create a Stripe Connect v2 account for a travel expert
 * Supports flexible configurations for experts who may also be travelers
 */
export async function createConnectAccountV2(
  email: string,
  businessName?: string,
  country: string = 'US',
  businessType: 'individual' | 'company' = 'individual'
): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    controller: {
      type: 'platform',
      onboarding: {
        enabled: true
      },
      requirement_collection: 'platform',
      losses: {
        payments: 'platform' // Platform bears losses
      }
    },
    country,
    email,
    entity: {
      type: businessType,
      // Add business information if company
      ...(businessType === 'company' && businessName && {
        company: {
          name: businessName
        }
      })
    },
    configurations: {
      // Merchant configuration for receiving payments as an expert
      merchant: {
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        // Set up payout schedule
        payout_schedule: {
          interval: 'daily',
          delay_days: 2 // Minimum delay for daily payouts
        },
        // Business profile for the merchant side
        business_profile: {
          name: businessName || 'Travel Expert',
          product_description: 'Travel planning services, consultations, and trip templates',
          mcc: '7991', // Travel agencies and tour operators MCC
          url: `${process.env.NEXT_PUBLIC_APP_URL}/experts` // Platform URL for now
        }
      }
    },
    metadata: {
      platform: 'novatrek',
      account_type: 'expert',
      created_via: 'v2_api'
    }
  })

  return account
}

/**
 * Retrieve a Connect v2 account with configurations
 */
export async function getConnectAccountV2(accountId: string): Promise<Stripe.Account> {
  const account = await stripe.accounts.retrieve(accountId, {
    // Include configurations and entity data
    include: ['configurations.merchant', 'entity']
  })
  return account
}

/**
 * Check if a Connect v2 account has completed onboarding
 */
export async function isAccountOnboardedV2(accountId: string): Promise<{
  isComplete: boolean
  canAcceptPayments: boolean
  canReceivePayouts: boolean
  requirementsNeeded: string[]
}> {
  const account = await getConnectAccountV2(accountId)
  
  // Access merchant configuration
  const merchantConfig = account.configurations?.merchant
  const capabilities = merchantConfig?.capabilities
  
  // Check individual capabilities
  const canAcceptPayments = capabilities?.card_payments?.active === true
  const canReceivePayouts = capabilities?.transfers?.active === true
  
  // Get any pending requirements
  const requirementsNeeded = [
    ...(account.future_requirements?.currently_due || []),
    ...(account.requirements?.currently_due || [])
  ]
  
  return {
    isComplete: canAcceptPayments && canReceivePayouts && requirementsNeeded.length === 0,
    canAcceptPayments,
    canReceivePayouts,
    requirementsNeeded
  }
}

/**
 * Update payout schedule for a Connect v2 account
 */
export async function updatePayoutScheduleV2(
  accountId: string,
  interval: 'daily' | 'weekly' | 'monthly'
): Promise<Stripe.Account> {
  const delayDays = interval === 'daily' ? 2 : interval === 'weekly' ? 7 : 30
  
  const account = await stripe.accounts.update(accountId, {
    configurations: {
      merchant: {
        payout_schedule: {
          interval,
          delay_days: delayDays
        }
      }
    }
  })
  
  return account
}

/**
 * Add customer configuration to existing expert account
 * This allows experts to also make purchases as travelers
 */
export async function addCustomerConfigurationV2(accountId: string): Promise<Stripe.Account> {
  const account = await stripe.accounts.update(accountId, {
    configurations: {
      // Keep existing merchant config and add customer config
      customer: {
        capabilities: {
          card_payments: { requested: true } // Can make payments
        }
      }
    }
  })
  
  return account
}

/**
 * Update business profile for v2 account
 */
export async function updateBusinessProfileV2(
  accountId: string,
  profile: {
    name?: string
    description?: string
    url?: string
    support_email?: string
    support_phone?: string
  }
): Promise<Stripe.Account> {
  const account = await stripe.accounts.update(accountId, {
    configurations: {
      merchant: {
        business_profile: {
          name: profile.name,
          product_description: profile.description,
          url: profile.url,
          support_email: profile.support_email,
          support_phone: profile.support_phone
        }
      }
    }
  })
  
  return account
}

/**
 * Create a payment intent with Connect v2 platform fee
 */
export async function createConnectPaymentIntentV2(
  amount: number,
  currency: string,
  connectedAccountId: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const platformFee = calculatePlatformFee(amount)
  
  // For v2, we still use the same payment intent creation
  // but the account structure is different
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
      account_version: 'v2',
      ...metadata,
    },
  })

  return paymentIntent
}

/**
 * Calculate platform fee (shared with v1)
 */
export function calculatePlatformFee(amount: number): number {
  const calculatedFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE)
  return Math.max(calculatedFee, MINIMUM_PLATFORM_FEE)
}

/**
 * Generate an account link for Connect v2 onboarding
 * Same as v1 but works with v2 accounts
 */
export async function createAccountLinkV2(
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
 * Create a login link for the Express dashboard (v2)
 */
export async function createLoginLinkV2(accountId: string): Promise<Stripe.LoginLink> {
  const loginLink = await stripe.accounts.createLoginLink(accountId)
  return loginLink
}

/**
 * Get balance for a Connect v2 account
 */
export async function getConnectBalanceV2(accountId: string): Promise<Stripe.Balance> {
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  })
  
  return balance
}

/**
 * Handle Connect v2 specific webhook events
 */
export async function handleConnectWebhookV2(
  event: Stripe.Event
): Promise<{ success: boolean; message?: string; data?: any }> {
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object as Stripe.Account
      
      // Check if this is a v2 account
      if (account.metadata?.created_via === 'v2_api') {
        // Get full account with configurations
        const fullAccount = await getConnectAccountV2(account.id)
        
        // Check onboarding status
        const onboardingStatus = await isAccountOnboardedV2(account.id)
        
        return {
          success: true,
          message: 'V2 account updated',
          data: {
            accountId: account.id,
            onboardingStatus,
            configurations: fullAccount.configurations
          }
        }
      }
      break

    case 'capability.updated':
      // V2 specific: Handle capability updates
      const capability = event.data.object as Stripe.Capability
      console.log('Capability updated:', capability.id, capability.status)
      
      return {
        success: true,
        message: 'Capability updated',
        data: {
          capability: capability.id,
          status: capability.status,
          accountId: capability.account
        }
      }

    default:
      // Let v1 handler process other events
      return { success: true, message: 'Not a v2-specific event' }
  }

  return { success: true }
}