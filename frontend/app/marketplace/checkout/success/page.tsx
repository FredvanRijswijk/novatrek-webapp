'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel, MarketplaceTransaction } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Loader2,
  Download,
  MessageSquare,
  Calendar,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<MarketplaceTransaction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const transactionId = searchParams.get('transaction_id')
  const paymentIntent = searchParams.get('payment_intent')

  useEffect(() => {
    async function verifyTransaction() {
      if (!user || !transactionId) {
        setError('Invalid transaction')
        setLoading(false)
        return
      }

      try {
        // Get transaction details
        const trans = await MarketplaceModel.getTransaction(transactionId)
        
        if (!trans || trans.buyerId !== user.uid) {
          setError('Transaction not found')
          return
        }

        // Update transaction status if needed
        if (trans.status === 'pending' && paymentIntent) {
          // In production, verify with Stripe webhook instead
          await MarketplaceModel.updateTransactionStatus(transactionId, 'completed')
          trans.status = 'completed'
        }

        setTransaction(trans)
      } catch (err) {
        console.error('Error verifying transaction:', err)
        setError('Failed to verify transaction')
      } finally {
        setLoading(false)
      }
    }

    verifyTransaction()
  }, [user, transactionId, paymentIntent])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Unable to load transaction details'}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          asChild
        >
          <Link href="/marketplace">
            Back to Marketplace
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your order has been confirmed and the expert has been notified
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Transaction ID: {transaction.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-lg">{transaction.productTitle}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.productType.replace('_', ' ')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Amount Paid</p>
              <p className="font-medium">{formatCurrency(transaction.amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-medium">
                {transaction.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Here's what happens after your purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transaction.productType === 'trip_template' && (
              <>
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Access Your Trip Template</p>
                    <p className="text-sm text-muted-foreground">
                      The trip template has been added to your account
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Customize Your Itinerary</p>
                    <p className="text-sm text-muted-foreground">
                      Personalize dates, activities, and accommodations
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {transaction.productType === 'consultation' && (
              <>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Expert Will Contact You</p>
                    <p className="text-sm text-muted-foreground">
                      The travel expert will reach out within 24 hours to schedule your consultation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Schedule Your Session</p>
                    <p className="text-sm text-muted-foreground">
                      Work with the expert to find a convenient time
                    </p>
                  </div>
                </div>
              </>
            )}

            {transaction.productType === 'custom_planning' && (
              <>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Planning Begins</p>
                    <p className="text-sm text-muted-foreground">
                      The expert will start working on your custom travel plan
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Receive Your Plan</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive your personalized travel plan within the agreed timeframe
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button asChild className="flex-1">
          <Link href="/dashboard/trips">
            View My Trips
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/marketplace">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  )
}