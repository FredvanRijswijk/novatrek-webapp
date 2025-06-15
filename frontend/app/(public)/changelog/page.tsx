import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Bug, Wrench, Rocket } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Changelog - NovaTrek Updates & Features',
  description: 'Stay updated with the latest features, improvements, and bug fixes in NovaTrek. See what\'s new in our AI-powered travel planning platform.',
  keywords: 'NovaTrek changelog, travel app updates, new features, product updates, travel planning improvements',
  openGraph: {
    title: 'NovaTrek Changelog - Latest Updates & Features',
    description: 'Discover the latest features and improvements in NovaTrek\'s AI-powered travel planning platform.',
    images: ['/og-image.png'],
  },
}

interface ChangelogEntry {
  date: string
  version: string
  title: string
  description: string
  changes: {
    type: 'feature' | 'improvement' | 'fix'
    title: string
    description: string
    highlights?: string[]
  }[]
}

const changelog: ChangelogEntry[] = [
  {
    date: 'January 15, 2025',
    version: 'Week 3',
    title: 'Interactive Maps & User Feedback',
    description: 'Enhanced map experience with photo integration and improved user feedback collection.',
    changes: [
      {
        type: 'feature',
        title: 'Interactive Map View',
        description: 'Explore destinations with our new interactive map featuring Google Places photos.',
        highlights: [
          'Interactive map with destination markers',
          'Google Places photo integration for visual exploration',
          'Hover effects for better user interaction',
          'Direct coordinate access for precise location planning'
        ]
      },
      {
        type: 'feature',
        title: 'Enhanced Feedback System',
        description: 'Improved feedback collection with Firebase Admin SDK integration.',
        highlights: [
          'Seamless feedback submission process',
          'Firebase Admin SDK for secure server-side operations',
          'Better error handling for feedback creation',
          'Improved data validation and storage'
        ]
      },
      {
        type: 'improvement',
        title: 'Map Component Updates',
        description: 'Refined map components for better performance and user experience.',
        highlights: [
          'Optimized hover effects on map markers',
          'Improved coordinate handling',
          'Better responsive design for mobile devices',
          'Enhanced visual feedback for user interactions'
        ]
      },
      {
        type: 'fix',
        title: 'Firebase Integration Fixes',
        description: 'Resolved issues with Firebase Admin SDK and Firestore operations.',
        highlights: [
          'Fixed undefined values in Firestore feedback creation',
          'Corrected Firebase Admin SDK imports',
          'Improved error handling for database operations',
          'Enhanced data validation before storage'
        ]
      }
    ]
  },
  {
    date: 'January 13, 2025',
    version: 'Week 2',
    title: 'V2 Architecture & Weather Integration',
    description: 'Major refactoring for better performance and weather-aware trip planning.',
    changes: [
      {
        type: 'feature',
        title: 'Weather Integration',
        description: 'Real-time weather data throughout your trip planning experience.',
        highlights: [
          'Weather display in itinerary day selector',
          'Weather-aware activity recommendations',
          'Indoor/outdoor activity filtering based on conditions',
          '6-hour weather caching for optimal performance'
        ]
      },
      {
        type: 'feature',
        title: 'Enhanced Activity Search',
        description: 'Discover activities with rich details and smart recommendations.',
        highlights: [
          'Photo previews from Google Places',
          'Meal type detection (breakfast, lunch, dinner)',
          'Expert curated recommendations',
          'Weather-based activity suggestions'
        ]
      },
      {
        type: 'feature',
        title: 'Packing List V2',
        description: 'Smart packing lists that adapt to your trip.',
        highlights: [
          'AI-powered suggestions based on weather and activities',
          'Category organization with progress tracking',
          'Shared items for group trips',
          'Weather-aware clothing recommendations'
        ]
      },
      {
        type: 'improvement',
        title: 'V2 Architecture Migration',
        description: 'Complete removal of legacy code for better performance.',
        highlights: [
          'Eliminated V1 backwards compatibility overhead',
          'Standardized data structure across the platform',
          'Improved query performance',
          'Cleaner, more maintainable codebase'
        ]
      },
      {
        type: 'fix',
        title: 'Bug Fixes & Improvements',
        description: 'Various fixes for a smoother experience.',
        highlights: [
          'Fixed "Day not found" errors in itinerary builder',
          'Resolved photo display issues in activity search',
          'Fixed weather data fetching in activity API',
          'Improved error handling throughout the app'
        ]
      }
    ]
  },
  {
    date: 'January 6, 2025',
    version: 'Week 1',
    title: 'AI Chat V2 & Enhanced Planning',
    description: 'Revolutionary AI-powered trip planning with advanced tools and real-time collaboration.',
    changes: [
      {
        type: 'feature',
        title: 'AI Chat V2 with Tool Calling',
        description: 'Next-generation AI assistant with powerful planning capabilities.',
        highlights: [
          'Natural language trip modifications',
          'Smart activity suggestions with conflict detection',
          'Visual timeline preview',
          'Selective activity saving with checkboxes'
        ]
      },
      {
        type: 'feature',
        title: 'V2 Data Structure',
        description: 'New architecture with Firestore subcollections for better performance.',
        highlights: [
          'Faster data loading and updates',
          'Better support for complex trip structures',
          'Improved real-time synchronization',
          'Enhanced mobile app compatibility'
        ]
      },
      {
        type: 'feature',
        title: 'Enhanced Hotel Search',
        description: 'Comprehensive accommodation search and booking features.',
        highlights: [
          'AI-powered hotel recommendations',
          'Integration with trip chat for seamless planning',
          'Smart prompts and suggestions',
          'Direct saving to itinerary'
        ]
      },
      {
        type: 'feature',
        title: 'Admin & Expert Systems',
        description: 'New tools for content curation and platform management.',
        highlights: [
          'Expert activity curation interface',
          'Admin user management system',
          'Marketplace analytics dashboards',
          'NovaTrek recommendations system'
        ]
      },
      {
        type: 'feature',
        title: 'Trip Sharing & Collaboration',
        description: 'Share your trips with friends and family.',
        highlights: [
          'Secure trip sharing with tokens',
          'Public read-only trip views',
          'Short URLs (/s/) for easy sharing',
          'Mobile-optimized shared views'
        ]
      },
      {
        type: 'improvement',
        title: 'Mobile Experience',
        description: 'Enhanced mobile navigation and responsive design.',
        highlights: [
          'New hamburger menu for mobile',
          'Improved touch interactions',
          'Better responsive layouts',
          'Optimized performance on mobile devices'
        ]
      }
    ]
  }
]

function getTypeIcon(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature':
      return <Sparkles className="h-4 w-4" />
    case 'improvement':
      return <Wrench className="h-4 w-4" />
    case 'fix':
      return <Bug className="h-4 w-4" />
  }
}

function getTypeBadgeVariant(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature':
      return 'default'
    case 'improvement':
      return 'secondary'
    case 'fix':
      return 'outline'
  }
}

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Changelog
        </h1>
        <p className="text-xl text-muted-foreground">
          Stay updated with the latest features and improvements to NovaTrek.
        </p>
      </div>

      {/* Subscribe CTA */}
      <Card className="mb-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold mb-1">Get notified about updates</h3>
            <p className="text-sm text-muted-foreground">
              Join our newsletter to receive updates about new features.
            </p>
          </div>
          <Button>
            Subscribe
          </Button>
        </CardContent>
      </Card>

      {/* Changelog Entries */}
      <div className="space-y-12">
        {changelog.map((entry, index) => (
          <div key={index}>
            {/* Version Header */}
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="outline" className="font-mono">
                {entry.version}
              </Badge>
              <time className="text-sm text-muted-foreground">
                {entry.date}
              </time>
              {index === 0 && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  Current Week
                </Badge>
              )}
            </div>

            {/* Entry Title & Description */}
            <h2 className="text-2xl font-bold mb-2">{entry.title}</h2>
            <p className="text-muted-foreground mb-6">{entry.description}</p>

            {/* Changes */}
            <div className="space-y-6">
              {entry.changes.map((change, changeIndex) => (
                <Card key={changeIndex}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getTypeBadgeVariant(change.type) as any} className="gap-1">
                        {getTypeIcon(change.type)}
                        {change.type.charAt(0).toUpperCase() + change.type.slice(1)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{change.title}</CardTitle>
                    <CardDescription>{change.description}</CardDescription>
                  </CardHeader>
                  {change.highlights && (
                    <CardContent>
                      <ul className="space-y-2">
                        {change.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Rocket className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Divider */}
            {index < changelog.length - 1 && (
              <div className="border-t mt-12" />
            )}
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-16 text-center">
        <h3 className="text-xl font-semibold mb-2">Ready to plan your next adventure?</h3>
        <p className="text-muted-foreground mb-6">
          Experience all these features and more with NovaTrek.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/waitlist">
            <Button size="lg">
              Get Started Free
            </Button>
          </Link>
          <Link href="/features">
            <Button variant="outline" size="lg">
              Explore Features
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}