'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Languages, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TravelExpert } from '@/lib/models/marketplace'
import { formatLocation } from '@/lib/utils/slug'

interface ExpertCardProps {
  expert: TravelExpert
  variant?: 'default' | 'compact'
}

export function ExpertCard({ expert, variant = 'default' }: ExpertCardProps) {
  const location = formatLocation(expert.location)
  
  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <Link href={`/experts/${expert.slug}`} className="block">
          <div className="flex items-center gap-4 p-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              {expert.profileImageUrl ? (
                <Image
                  src={expert.profileImageUrl}
                  alt={expert.businessName}
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-primary/50">
                    {expert.businessName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{expert.businessName}</h3>
              {expert.tagline && (
                <p className="text-sm text-muted-foreground truncate">{expert.tagline}</p>
              )}
              <div className="flex items-center gap-4 mt-1">
                {expert.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{expert.rating.toFixed(1)}</span>
                  </div>
                )}
                {location && (
                  <span className="text-xs text-muted-foreground truncate">{location}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/experts/${expert.slug}`}>
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
          <Button size="sm" asChild>
            <Link href={`/experts/${expert.slug}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}