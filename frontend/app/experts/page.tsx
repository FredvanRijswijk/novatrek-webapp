'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Languages, Award, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'
import { TravelExpert } from '@/lib/models/marketplace'
import type { MarketplaceExpertEnhanced } from '@/lib/models/marketplace-enhanced'
import { formatLocation, generateSlug } from '@/lib/utils/slug'
import { track } from '@vercel/analytics'
import { PublicLayout } from '@/components/layout/PublicLayout'

function ExpertsPage() {
  const [experts, setExperts] = useState<TravelExpert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExperts() {
      try {
        const expertsData = await MarketplaceModel.getActiveExperts(50)
        // Convert enhanced experts to regular TravelExpert type
        const formattedExperts = expertsData.map(expert => ({
      ...expert,
      // Ensure all required fields are present
      id: expert.id,
      userId: expert.userId,
      slug: expert.slug || generateSlug(expert.businessName), // Generate slug if missing
      businessName: expert.businessName,
      description: expert.description,
      location: expert.location,
      specializations: expert.specializations || [],
      languages: expert.languages || [],
      certifications: expert.certifications || [],
      profileImageUrl: expert.profileImageUrl,
      coverImageUrl: expert.coverImageUrl,
      rating: expert.rating || 0,
      reviewCount: expert.reviewCount || 0,
      yearsOfExperience: expert.yearsOfExperience,
      status: expert.status || 'pending',
      isApproved: expert.isApproved || false,
      stripeAccountId: expert.stripeAccountId,
      stripeAccountStatus: expert.stripeAccountStatus,
      onboardingComplete: expert.onboardingComplete || false,
      tagline: expert.tagline,
      website: expert.website,
      socialMedia: expert.socialMedia || {},
      commission: expert.commission || 15,
      availability: expert.availability || {},
      responseTime: expert.responseTime,
      createdAt: expert.createdAt,
          updatedAt: expert.updatedAt
        } as TravelExpert))
        setExperts(formattedExperts)
      } catch (error) {
        console.error('Error fetching experts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchExperts()
  }, [])

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Find Your Perfect Travel Expert
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Connect with certified travel professionals who specialize in creating unforgettable experiences.
            From local guides to luxury planners, find the expert who matches your travel style.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => {
                track('click', { button: 'become_expert_hero', page: 'experts' })
              }}
              asChild
            >
              <Link href="/dashboard/become-expert">Become an Expert</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Experts Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Featured Travel Experts</h2>
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : experts.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent>
                <p className="text-lg text-muted-foreground mb-4">
                  No experts available at the moment.
                </p>
                <Button 
                  onClick={() => {
                    track('click', { button: 'be_first_expert', page: 'experts' })
                  }}
                  asChild
                >
                  <Link href="/dashboard/become-expert">Be the First Expert</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Experts</h3>
              <p className="text-muted-foreground">
                Explore profiles of verified travel experts with different specializations and destinations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book a Service</h3>
              <p className="text-muted-foreground">
                Choose from trip templates, consultations, or custom planning services that fit your needs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Travel with Confidence</h3>
              <p className="text-muted-foreground">
                Get personalized recommendations and support from your expert throughout your journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Share Your Travel Expertise
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join our community of travel experts and earn by helping others plan their perfect trips.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => {
              track('click', { button: 'apply_expert_cta', page: 'experts' })
            }}
            asChild
          >
            <Link href="/dashboard/become-expert">Apply to Become an Expert</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}

export default ExpertsPage

function ExpertCard({ expert }: { expert: TravelExpert }) {
  const location = formatLocation(expert.location)
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link 
        href={`/experts/${expert.slug}`}
        onClick={() => {
          track('click', { 
            button: 'expert_card_image', 
            page: 'experts',
            expertId: expert.id,
            expertSlug: expert.slug
          })
        }}
      >
        <div className="aspect-[4/3] relative">
          {expert.profileImageUrl ? (
            <Image
              src={expert.profileImageUrl}
              alt={expert.businessName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary/50">
                {expert.businessName.charAt(0)}
              </span>
            </div>
          )}
          {expert.rating > 0 && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{expert.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">
          <Link href={`/experts/${expert.slug}`} className="hover:underline">
            {expert.businessName}
          </Link>
        </CardTitle>
        {expert.tagline && (
          <CardDescription className="line-clamp-2">{expert.tagline}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}
        
        {expert.languages && expert.languages.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Languages className="h-4 w-4" />
            <span className="line-clamp-1">{expert.languages.slice(0, 3).join(', ')}</span>
          </div>
        )}
        
        {expert.yearsOfExperience && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{expert.yearsOfExperience}+ years experience</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {expert.specializations.slice(0, 3).map((spec) => (
            <Badge key={spec} variant="secondary" className="text-xs">
              {spec}
            </Badge>
          ))}
          {expert.specializations.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{expert.specializations.length - 3} more
            </Badge>
          )}
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {expert.reviewCount > 0 ? (
              <span>{expert.reviewCount} reviews</span>
            ) : (
              <span>New expert</span>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={() => {
              track('click', { 
                button: 'view_expert_profile', 
                page: 'experts',
                expertId: expert.id,
                expertSlug: expert.slug,
                expertRating: expert.rating
              })
            }}
            asChild
          >
            <Link href={`/experts/${expert.slug}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}