'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel, TravelExpert, MarketplaceProduct, ProductReview } from '@/lib/models/marketplace'
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
  Globe,
  Award,
  MessageCircle,
  CheckCircle,
  Languages,
  Briefcase,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Mail,
  Phone,
  ChevronRight,
  Heart,
  Share2,
  VerifiedIcon,
  Shield
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

const SOCIAL_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
}

export default function ExpertProfilePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useFirebase()
  const [expert, setExpert] = useState<TravelExpert | null>(null)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    loadExpertData()
  }, [resolvedParams.id])

  const loadExpertData = async () => {
    try {
      // Load expert profile
      const expertData = await MarketplaceModel.getExpert(resolvedParams.id)
      if (!expertData || expertData.status !== 'active') {
        router.push('/marketplace')
        return
      }
      setExpert(expertData)

      // Load expert's products
      const productsData = await MarketplaceModel.getProductsByExpert(resolvedParams.id, 'active')
      setProducts(productsData)

      // Load reviews for all products
      const allReviews: ProductReview[] = []
      for (const product of productsData) {
        const productReviews = await MarketplaceModel.getReviewsByProduct(product.id)
        allReviews.push(...productReviews)
      }
      setReviews(allReviews)
    } catch (error) {
      console.error('Error loading expert data:', error)
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const handleContact = () => {
    if (!user) {
      router.push('/login')
      return
    }
    // TODO: Implement messaging system
    alert('Messaging system coming soon!')
  }

  const calculateAverageResponseTime = () => {
    // TODO: Calculate from actual response times
    return '< 2 hours'
  }

  const calculateTotalReviews = () => {
    return expert?.reviewCount || 0
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg" />
              <div className="h-48 bg-gray-200 rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-lg" />
              <div className="h-32 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!expert) {
    return null
  }

  // Group products by type
  const tripTemplates = products.filter(p => p.type === 'trip_template')
  const consultations = products.filter(p => p.type === 'consultation')
  const customPlanning = products.filter(p => p.type === 'custom_planning')

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Cover Image */}
      <div className="relative h-80 bg-gradient-to-r from-blue-600 to-purple-600">
        {expert.coverImageUrl && (
          <Image
            src={expert.coverImageUrl}
            alt={expert.businessName}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={expert.profileImageUrl} alt={expert.businessName} />
                <AvatarFallback className="text-2xl">{expert.businessName.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{expert.businessName}</h1>
                  {expert.certifications && expert.certifications.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Verified Expert
                    </Badge>
                  )}
                </div>
                {expert.tagline && (
                  <p className="text-lg text-white/90 mb-2">{expert.tagline}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  {expert.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {expert.location.city}, {expert.location.country}
                    </div>
                  )}
                  {expert.yearsOfExperience && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {expert.yearsOfExperience} years experience
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {expert.rating.toFixed(1)} ({expert.reviewCount} reviews)
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  <Heart className={`h-5 w-5 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button onClick={handleContact} size="lg">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Expert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="space-y-6 mt-6">
                {/* Trip Templates */}
                {tripTemplates.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Trip Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tripTemplates.map(product => (
                        <Link key={product.id} href={`/marketplace/products/${product.id}`}>
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{product.title}</CardTitle>
                                <Badge variant="secondary">
                                  ${(product.price / 100).toFixed(0)}
                                </Badge>
                              </div>
                              <CardDescription className="line-clamp-2">
                                {product.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {product.tripLength && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {product.tripLength} days
                                  </div>
                                )}
                                {product.destinations && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {product.destinations.length} destinations
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consultations */}
                {consultations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Consultation Services</h3>
                    <div className="space-y-4">
                      {consultations.map(product => (
                        <Link key={product.id} href={`/marketplace/products/${product.id}`}>
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle className="text-lg">{product.title}</CardTitle>
                                  <CardDescription>{product.description}</CardDescription>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">${(product.price / 100).toFixed(0)}</p>
                                  {product.duration && (
                                    <p className="text-sm text-muted-foreground">{product.duration}</p>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Planning */}
                {customPlanning.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Custom Travel Planning</h3>
                    <div className="space-y-4">
                      {customPlanning.map(product => (
                        <Link key={product.id} href={`/marketplace/products/${product.id}`}>
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                              <CardTitle className="text-lg">{product.title}</CardTitle>
                              <CardDescription>{product.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <Badge variant="outline">Custom Quote</Badge>
                                <Button variant="ghost" size="sm">
                                  Learn More <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {expert.businessName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {expert.bio && (
                      <div>
                        <h4 className="font-semibold mb-2">Bio</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{expert.bio}</p>
                      </div>
                    )}

                    {expert.specializations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {expert.specializations.map(spec => (
                            <Badge key={spec} variant="secondary">{spec}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {expert.languages && expert.languages.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          Languages
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {expert.languages.map(lang => (
                            <Badge key={lang} variant="outline">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {expert.certifications && expert.certifications.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Certifications & Awards
                        </h4>
                        <ul className="space-y-1">
                          {expert.certifications.map(cert => (
                            <li key={cert} className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {cert}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {expert.featuredIn && expert.featuredIn.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Featured In</h4>
                        <div className="flex flex-wrap gap-2">
                          {expert.featuredIn.map(media => (
                            <Badge key={media} variant="outline">{media}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>
                      Based on {calculateTotalReviews()} reviews across all services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.slice(0, 10).map(review => (
                          <div key={review.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
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
                                        Verified Purchase
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(review.createdAt, 'MMM d, yyyy')}
                              </p>
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                            {review.response && (
                              <div className="ml-12 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-semibold mb-1">Response from {expert.businessName}:</p>
                                <p className="text-sm text-muted-foreground">{review.response.text}</p>
                              </div>
                            )}
                            <Separator />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No reviews yet. Be the first to book and review!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Expert Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-semibold">{calculateAverageResponseTime()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Trips Planned</span>
                  <span className="font-semibold">{expert.totalTripsPlanned || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-semibold">{format(expert.createdAt, 'MMM yyyy')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expert.contactEmail && (
                  <a
                    href={`mailto:${expert.contactEmail}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{expert.contactEmail}</span>
                  </a>
                )}
                {expert.websiteUrl && (
                  <a
                    href={expert.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Visit Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {expert.socialLinks && (
                  <div className="flex gap-2 pt-2">
                    {Object.entries(expert.socialLinks).map(([platform, url]) => {
                      if (!url) return null
                      const Icon = SOCIAL_ICONS[platform] || Globe
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Trust & Safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Identity Verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Background Checked</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Licensed Travel Professional</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}