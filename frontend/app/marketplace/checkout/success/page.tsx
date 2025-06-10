'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'
import { MarketplaceProduct, TravelExpert } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Download, MessageCircle, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useFirebase()
  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [expert, setExpert] = useState<TravelExpert | null>(null)
  const [loading, setLoading] = useState(true)

  const productId = searchParams.get('product_id')

  useEffect(() => {
    if (!productId) {
      router.push('/marketplace')
      return
    }

    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    loadData()
  }, [productId])

  const loadData = async () => {
    try {
      const productData = await MarketplaceModel.getProduct(productId!)
      if (productData) {
        setProduct(productData)
        
        const expertData = await MarketplaceModel.getExpert(productData.expertId)
        if (expertData) {
          setExpert(expertData)
        }
      }
    } catch (error) {
      console.error('Error loading success data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Purchase Successful!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. We've sent a confirmation email with all the details.
          </p>
        </div>

        {/* Order Details */}
        {product && expert && (
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>
                Your purchase has been confirmed and the expert has been notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">{product.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Provided by {expert.businessName}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">What happens next?</h4>
                
                {product.type === 'trip_template' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Download className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Access your trip template</p>
                        <p className="text-sm text-muted-foreground">
                          The full trip itinerary and planning documents are now available in your dashboard
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Contact your expert</p>
                        <p className="text-sm text-muted-foreground">
                          Reach out to {expert.businessName} for any questions or customizations
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {product.type === 'consultation' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Schedule your consultation</p>
                        <p className="text-sm text-muted-foreground">
                          {expert.businessName} will contact you within 24 hours to schedule your session
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Prepare your questions</p>
                        <p className="text-sm text-muted-foreground">
                          Make the most of your consultation by preparing your travel questions in advance
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {product.type === 'custom_planning' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Initial consultation</p>
                        <p className="text-sm text-muted-foreground">
                          {expert.businessName} will reach out to discuss your travel needs and preferences
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Custom itinerary creation</p>
                        <p className="text-sm text-muted-foreground">
                          Your personalized travel plan will be ready within 5-7 business days
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/marketplace">
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Support Note */}
        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact our support team at{' '}
          <a href="mailto:support@novatrek.com" className="text-primary hover:underline">
            support@novatrek.com
          </a>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}