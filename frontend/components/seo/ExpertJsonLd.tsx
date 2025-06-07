import { TravelExpert } from '@/lib/models/marketplace'
import { formatLocation } from '@/lib/utils/slug'

interface ExpertJsonLdProps {
  expert: TravelExpert
}

export function ExpertJsonLd({ expert }: ExpertJsonLdProps) {
  const location = formatLocation(expert.location)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: expert.businessName,
    description: expert.bio,
    url: `${baseUrl}/experts/${expert.slug}`,
    image: expert.profileImageUrl,
    jobTitle: 'Travel Expert',
    worksFor: {
      '@type': 'Organization',
      name: 'NovaTrek',
      url: baseUrl
    },
    address: expert.location ? {
      '@type': 'PostalAddress',
      addressLocality: expert.location.city,
      addressRegion: expert.location.state,
      addressCountry: expert.location.country
    } : undefined,
    aggregateRating: expert.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: expert.rating,
      reviewCount: expert.reviewCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    knowsLanguage: expert.languages,
    hasCredential: expert.certifications?.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      name: cert
    })),
    sameAs: [
      expert.websiteUrl,
      expert.socialLinks?.instagram,
      expert.socialLinks?.facebook,
      expert.socialLinks?.twitter,
      expert.socialLinks?.linkedin,
      expert.socialLinks?.youtube
    ].filter(Boolean)
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}