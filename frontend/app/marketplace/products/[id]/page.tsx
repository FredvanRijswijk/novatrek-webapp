'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel, MarketplaceProduct, TravelExpert, ProductReview } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  Check,
  Heart,
  Share2,
  ChevronRight,
  Shield,
  Award,
  MessageCircle,
  DollarSign,
  Sparkles,
  Info,
  Globe,
  Plane,
  Hotel,
  Utensils,
  Camera
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

const INCLUDED_ICONS: Record<string, any> = {
  'accommodation': Hotel,
  'flights': Plane,
  'meals': Utensils,
  'activities': Camera,
  'guide': Users,
  'transport': Globe,
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useFirebase()
  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [expert, setExpert] = useState<TravelExpert | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    loadProductData()
  }, [resolvedParams.id])

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

      // Load reviews
      const reviewsData = await MarketplaceModel.getReviewsByProduct(resolvedParams.id)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error loading product:', error)
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    // Navigate to checkout
    router.push(`/marketplace/checkout/${resolvedParams.id}`)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
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

  if (!product || !expert) {
    return null
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/placeholder-trip.jpg']

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Images */}
      <div className="relative h-[400px] md:h-[500px] bg-muted">
        {images[selectedImage] ? (
          <Image
            src={images[selectedImage]}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <Sparkles className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedImage 
                    ? 'bg-white w-8' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={() => setIsFavorited(!isFavorited)}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Basic Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">
                    {product.type === 'trip_template' ? 'Trip Template' : 
                     product.type === 'consultation' ? 'Consultation' : 'Custom Planning'}
                  </Badge>
                  <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                  
                  {/* Quick Info */}
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {product.type === 'trip_template' && product.destinations && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {product.destinations.join(', ')}
                      </span>
                    )}
                    {product.type === 'trip_template' && product.tripLength && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {product.tripLength} days
                      </span>
                    )}
                    {product.type === 'consultation' && product.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {product.duration}
                      </span>
                    )}
                    {product.maxGroupSize && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Max {product.maxGroupSize} people
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="itinerary">
                  {product.type === 'trip_template' ? 'Itinerary' : 'Details'}
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>About This {product.type === 'trip_template' ? 'Trip' : 'Service'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                  </CardContent>
                </Card>

                {/* Highlights */}
                {product.highlights && product.highlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Highlights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 mt-0.5" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* What's Included */}
                <Card>
                  <CardHeader>
                    <CardTitle>What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {product.included.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Info */}
                {product.type === 'trip_template' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Trip Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.difficulty && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Difficulty Level</span>
                          <Badge variant={
                            product.difficulty === 'easy' ? 'secondary' :
                            product.difficulty === 'moderate' ? 'default' : 'destructive'
                          }>
                            {product.difficulty.charAt(0).toUpperCase() + product.difficulty.slice(1)}
                          </Badge>
                        </div>
                      )}
                      {product.bestTimeToVisit && product.bestTimeToVisit.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Best Time to Visit</span>
                          <span>{product.bestTimeToVisit.join(', ')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {product.type === 'trip_template' ? 'Day-by-Day Itinerary' : 'Service Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Detailed itinerary information would be displayed here. This could include
                      day-by-day activities, accommodation details, and more.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage src={review.buyerPhotoUrl} />
                                <AvatarFallback>{review.buyerName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{review.buyerName}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {review.verified && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(review.createdAt, 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                          
                          {review.response && (
                            <div className="mt-4 pl-4 border-l-2 border-muted">
                              <p className="text-sm font-semibold mb-1">Response from {expert.businessName}</p>
                              <p className="text-sm text-muted-foreground">{review.response.text}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-3xl">{formatPrice(product.price)}</CardTitle>
                  {product.type === 'trip_template' && (
                    <span className="text-muted-foreground">per person</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleBooking}
                >
                  Book Now
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Secure booking · Instant confirmation
                </div>

                <Separator />

                {/* Expert Info */}
                <div className="space-y-3">
                  <p className="font-semibold">About the Expert</p>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={expert.profileImageUrl} />
                      <AvatarFallback>{expert.businessName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{expert.businessName}</p>
                      {expert.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{expert.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({expert.reviewCount} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {expert.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{expert.bio}</p>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/marketplace/experts/${expert.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-sm">Money-back Guarantee</p>
                    <p className="text-xs text-muted-foreground">Full refund if not satisfied</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">Verified Expert</p>
                    <p className="text-xs text-muted-foreground">Background checked & certified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-sm">24/7 Support</p>
                    <p className="text-xs text-muted-foreground">We're here to help anytime</p>
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