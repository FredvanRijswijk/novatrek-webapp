import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Star, 
  MapPin, 
  Languages, 
  Calendar, 
  Award, 
  Globe, 
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Shield,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'
import { TravelExpert, MarketplaceProduct, ProductReview } from '@/lib/models/marketplace'
import { formatLocation, generateMetaDescription } from '@/lib/utils/slug'
import { ExpertJsonLd } from '@/components/seo/ExpertJsonLd'

interface ExpertPageProps {
  params: {
    slug: string
  }
}

async function getExpertBySlug(slug: string): Promise<TravelExpert | null> {
  try {
    return await MarketplaceModel.getExpertBySlug(slug)
  } catch (error) {
    console.error('Error fetching expert:', error)
    return null
  }
}

async function getExpertProducts(expertId: string): Promise<MarketplaceProduct[]> {
  try {
    return await MarketplaceModel.getProductsByExpert(expertId, 'active')
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function generateMetadata({ params }: ExpertPageProps): Promise<Metadata> {
  const expert = await getExpertBySlug(params.slug)
  
  if (!expert) {
    return {
      title: 'Expert Not Found | NovaTrek',
      description: 'The travel expert you are looking for could not be found.'
    }
  }

  const title = `${expert.businessName} - Travel Expert | NovaTrek`
  const description = expert.tagline || generateMetaDescription(expert.bio)
  const location = formatLocation(expert.location)

  return {
    title,
    description,
    keywords: [
      expert.businessName,
      'travel expert',
      'trip planner',
      ...expert.specializations,
      location
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://novatrek.app/experts/${expert.slug}`,
      images: expert.profileImageUrl ? [
        {
          url: expert.profileImageUrl,
          width: 800,
          height: 800,
          alt: expert.businessName
        }
      ] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: expert.profileImageUrl ? [expert.profileImageUrl] : undefined
    }
  }
}

export default async function ExpertProfilePage({ params }: ExpertPageProps) {
  const expert = await getExpertBySlug(params.slug)
  
  if (!expert) {
    notFound()
  }

  const products = await getExpertProducts(expert.id)
  const location = formatLocation(expert.location)

  return (
    <>
      <ExpertJsonLd expert={expert} />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 relative bg-gradient-to-br from-primary/20 to-primary/10">
          {expert.coverImageUrl && (
            <Image
              src={expert.coverImageUrl}
              alt={`${expert.businessName} cover`}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
        
        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-background rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Image */}
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={expert.profileImageUrl} alt={expert.businessName} />
                <AvatarFallback className="text-4xl">
                  {expert.businessName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Expert Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{expert.businessName}</h1>
                  {expert.tagline && (
                    <p className="text-xl text-muted-foreground mt-2">{expert.tagline}</p>
                  )}
                </div>
                
                {/* Stats and Location */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {expert.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{expert.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({expert.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                  
                  {location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{location}</span>
                    </div>
                  )}
                  
                  {expert.yearsOfExperience && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{expert.yearsOfExperience}+ years experience</span>
                    </div>
                  )}
                  
                  {expert.totalTripsPlanned && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>{expert.totalTripsPlanned}+ trips planned</span>
                    </div>
                  )}
                </div>
                
                {/* Specializations */}
                <div className="flex flex-wrap gap-2">
                  {expert.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <Button size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Expert
                  </Button>
                  {expert.websiteUrl && (
                    <Button size="lg" variant="outline" asChild>
                      <a href={expert.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {expert.businessName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{expert.bio}</p>
                </div>
                
                {expert.languages && expert.languages.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {expert.languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {expert.certifications && expert.certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certifications
                    </h3>
                    <ul className="space-y-1">
                      {expert.certifications.map((cert) => (
                        <li key={cert} className="text-muted-foreground">
                          • {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {expert.featuredIn && expert.featuredIn.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Featured In</h3>
                    <div className="flex flex-wrap gap-2">
                      {expert.featuredIn.map((media) => (
                        <Badge key={media} variant="secondary">
                          {media}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {expert.socialLinks && Object.keys(expert.socialLinks).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Connect</h3>
                    <div className="flex gap-3">
                      {expert.socialLinks.instagram && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={expert.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {expert.socialLinks.facebook && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={expert.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {expert.socialLinks.twitter && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={expert.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {expert.socialLinks.linkedin && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={expert.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {expert.socialLinks.youtube && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={expert.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-6">
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No services available at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Reviews coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
    </>
  )
}

function ProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {product.images.length > 0 && (
        <div className="aspect-video relative">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{product.title}</CardTitle>
            <CardDescription className="mt-1">
              {product.type === 'trip_template' && 'Trip Template'}
              {product.type === 'consultation' && 'Consultation'}
              {product.type === 'custom_planning' && 'Custom Planning'}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${(product.price / 100).toFixed(0)}</p>
            {product.duration && (
              <p className="text-sm text-muted-foreground">{product.duration}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {product.description}
        </p>
        
        {product.destinations && product.destinations.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="line-clamp-1">{product.destinations.join(', ')}</span>
          </div>
        )}
        
        {product.rating > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}
        
        <Button className="w-full" asChild>
          <Link href={`/marketplace/checkout/${product.id}`}>
            Book Now
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}