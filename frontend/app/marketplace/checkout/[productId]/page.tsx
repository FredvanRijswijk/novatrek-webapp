'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel, MarketplaceProduct } from '@/lib/models/marketplace'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Shield, 
  CreditCard,
  Info,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ 
  product, 
  clientSecret,
  transactionId,
  platformFee,
  sellerEarnings
}: { 
  product: MarketplaceProduct
  clientSecret: string
  transactionId: string
  platformFee: number
  sellerEarnings: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/marketplace/checkout/success?transaction_id=${transactionId}`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-muted-foreground">
                {product.type.replace('_', ' ')} • By {product.expertName}
              </p>
            </div>
            <p className="font-medium">{formatCurrency(product.price)}</p>
          </div>
          
          <Separator />
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(product.price)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform Fee (15%)</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Expert Earnings</span>
              <span>{formatCurrency(sellerEarnings)}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="text-lg">{formatCurrency(product.price)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Enter your payment information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {formatCurrency(product.price)}
            </>
          )}
        </Button>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 mt-0.5" />
        <p>
          Your payment is secure and processed by Stripe. NovaTrek takes a 15% platform fee 
          to maintain the marketplace and ensure quality service.
        </p>
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<{
    transactionId: string
    platformFee: number
    sellerEarnings: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const productId = params.productId as string

  useEffect(() => {
    async function initializeCheckout() {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Load product details
        const productData = await MarketplaceModel.getProduct(productId)
        if (!productData) {
          setError('Product not found')
          return
        }

        setProduct(productData)

        // Create checkout session
        const token = await user.getIdToken()
        const response = await fetch('/api/marketplace/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productId,
            quantity: 1
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create checkout session')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
        setCheckoutData({
          transactionId: data.transactionId,
          platformFee: data.platformFee,
          sellerEarnings: data.sellerEarnings
        })
      } catch (err) {
        console.error('Checkout error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize checkout')
      } finally {
        setLoading(false)
      }
    }

    initializeCheckout()
  }, [user, productId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !product || !clientSecret || !checkoutData) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Unable to load checkout'}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          asChild
        >
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/marketplace/products/${productId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">
          Secure checkout powered by Stripe
        </p>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm 
          product={product} 
          clientSecret={clientSecret}
          transactionId={checkoutData.transactionId}
          platformFee={checkoutData.platformFee}
          sellerEarnings={checkoutData.sellerEarnings}
        />
      </Elements>
    </div>
  )
}