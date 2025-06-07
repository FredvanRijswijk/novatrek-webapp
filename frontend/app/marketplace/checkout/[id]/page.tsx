'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel, MarketplaceProduct, TravelExpert } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CreditCard,
  Lock,
  Calendar,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface PageProps {
  params: Promise<{ id: string }>
}

// Stripe will be initialized with connected account when needed
let stripePromise: Promise<any> | null = null

function CheckoutForm({ 
  product, 
  expert,
  formData,
  onSuccess 
}: { 
  product: MarketplaceProduct
  expert: TravelExpert
  formData: any
  onSuccess: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const { user } = useFirebase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !user) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Submit elements first
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Form validation failed')
        setProcessing(false)
        return
      }

      // Create payment intent on the server
      const response = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          productId: product.id,
          expertId: expert.id,
          customerDetails: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.message
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment after elements.submit()
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/marketplace/checkout/success?product_id=${product.id}`,
        },
        redirect: 'if_required'
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Complete Purchase
          </>
        )}
      </Button>
    </form>
  )
}

export default function CheckoutPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useFirebase()
  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [expert, setExpert] = useState<TravelExpert | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripeAccount, setStripeAccount] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadProductData()
  }, [resolvedParams.id, user])

  const loadProductData = async () => {
    try {
      // Load product
      const productData = await MarketplaceModel.getProduct(resolvedParams.id)
      if (!productData || productData.status !== 'active') {
        router.push('/marketplace')
        return
      }
      setProduct(productData)

      // Load expert
      const expertData = await MarketplaceModel.getExpert(productData.expertId)
      if (expertData) {
        setExpert(expertData)
      }

      // Pre-fill user data
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.displayName || '',
          email: user.email || ''
        }))
      }

      // Create payment intent
      const token = await user?.getIdToken()
      const response = await fetch('/api/marketplace/checkout/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: productData.id,
          amount: productData.price
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret, stripeAccount } = await response.json()
      setClientSecret(clientSecret)
      setStripeAccount(stripeAccount)
      
      // Initialize Stripe with connected account
      stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
        stripeAccount: stripeAccount
      })
    } catch (error) {
      console.error('Error loading checkout data:', error)
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push(`/marketplace/checkout/success?product_id=${product?.id}`)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const calculatePlatformFee = (amount: number) => {
    // 15% platform fee
    return Math.round(amount * 0.15)
  }

  if (loading || !product || !expert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

  const platformFee = calculatePlatformFee(product.price)
  const expertEarnings = product.price - platformFee

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href={`/marketplace/products/${product.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to product
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
              <p className="text-muted-foreground">
                You're one step away from booking with {expert.businessName}
              </p>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  We'll use this information to send you booking confirmation and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message for {expert.businessName} (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Any special requirements or questions..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Your payment is processed securely through Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && stripePromise && (
                  <Elements 
                    stripe={stripePromise} 
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0070f3',
                        },
                      },
                    }}
                  >
                    <CheckoutForm 
                      product={product} 
                      expert={expert}
                      formData={formData}
                      onSuccess={handleSuccess}
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>SSL encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{product.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.type === 'trip_template' && 'Trip Template'}
                      {product.type === 'consultation' && 'Consultation Service'}
                      {product.type === 'custom_planning' && 'Custom Planning'}
                    </p>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-2 text-sm">
                    {product.duration && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{product.duration}</span>
                      </div>
                    )}
                    {product.tripLength && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{product.tripLength} days</span>
                      </div>
                    )}
                    {product.destinations && product.destinations.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{product.destinations.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Expert Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={expert.profileImageUrl} />
                    <AvatarFallback>{expert.businessName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{expert.businessName}</p>
                    <p className="text-xs text-muted-foreground">Travel Expert</p>
                  </div>
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span className="text-muted-foreground">Included</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(product.price)}</span>
                  </div>
                </div>

                {/* What's Included */}
                {product.included && product.included.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h5 className="font-semibold text-sm mb-2">What's Included</h5>
                      <ul className="space-y-1">
                        {product.included.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                        {product.included.length > 3 && (
                          <li className="text-sm text-muted-foreground">
                            +{product.included.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </>
                )}

                {/* Policies */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>• Instant booking confirmation</p>
                      <p>• Secure payment processing</p>
                      <p>• 24/7 customer support</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}