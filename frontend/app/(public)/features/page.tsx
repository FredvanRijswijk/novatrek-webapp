import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Brain,
  Users,
  Calendar,
  MapPin,
  Euro,
  Sun,
  Package,
  Camera,
  Shield,
  Plane,
  MessageSquare,
  Sparkles,
  Globe,
  Zap,
  BarChart3,
  Share2,
  Cloud,
  Check,
  ChevronRight,
  Wallet,
  Navigation,
  Clock,
  Home,
  Utensils,
  Mountain,
  Store,
  Inbox,
  FileText,
  UserCheck,
  Smartphone,
  Palette,
  Lock,
  Compass
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features - AI-Powered Travel Planning | NovaTrek',
  description: 'Discover NovaTrek\'s comprehensive features: AI trip planning, weather integration, smart packing lists, budget tracking, group travel tools, and expert marketplace.',
  keywords: 'travel planning features, AI trip planner, weather travel app, packing list app, group travel planning, travel budget tracker, trip itinerary builder',
  openGraph: {
    title: 'NovaTrek Features - Everything You Need for Perfect Trip Planning',
    description: 'AI-powered itineraries, real-time weather, smart packing lists, budget tracking, and more. See all features that make NovaTrek the ultimate travel companion.',
    images: ['/og-image.png'],
  },
}

const featureCategories = [
  {
    title: 'AI-Powered Planning',
    description: 'Let artificial intelligence create your perfect trip',
    icon: Brain,
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    features: [
      {
        icon: Sparkles,
        title: 'Smart Itinerary Generation',
        description: 'AI creates personalized day-by-day plans based on your preferences',
        details: [
          'Powered by GPT-4 and Google Gemini',
          'Considers travel style and budget',
          'Optimizes for travel distances',
          'Suggests hidden gems and local favorites'
        ]
      },
      {
        icon: MessageSquare,
        title: 'Natural Language Planning',
        description: 'Chat with AI to modify your trip in plain English',
        details: [
          'Ask questions like "Add a romantic dinner on day 3"',
          'Get instant suggestions and alternatives',
          'Visual timeline with conflict detection',
          'Save specific activities with one click'
        ]
      },
      {
        icon: Users,
        title: 'Group Compromise Engine',
        description: 'AI finds the perfect balance for everyone\'s preferences',
        details: [
          'Anonymous preference sharing',
          'Weighted preference matching',
          'Fair activity distribution',
          'Conflict resolution suggestions'
        ]
      }
    ]
  },
  {
    title: 'Weather & Activity Planning',
    description: 'Plan activities with real-time weather awareness',
    icon: Sun,
    color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    features: [
      {
        icon: Cloud,
        title: 'Real-Time Weather Integration',
        description: 'See weather forecasts for every day of your trip',
        details: [
          '7-day detailed forecasts',
          'Weather displayed in itinerary',
          'Severe weather alerts',
          '6-hour smart caching'
        ]
      },
      {
        icon: Home,
        title: 'Weather-Aware Recommendations',
        description: 'Get activity suggestions based on weather conditions',
        details: [
          'Indoor suggestions for rainy days',
          'Outdoor activities for perfect weather',
          'Automatic preference adjustments',
          'Weather severity indicators'
        ]
      },
      {
        icon: Compass,
        title: 'Smart Activity Search',
        description: 'Discover activities with Google Places integration',
        details: [
          'Photo previews for all places',
          'Real-time availability and hours',
          'Expert curated recommendations',
          'Filter by price, rating, and type'
        ]
      }
    ]
  },
  {
    title: 'Budget & Expense Management',
    description: 'Stay on budget with comprehensive tracking tools',
    icon: Euro,
    color: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    features: [
      {
        icon: Wallet,
        title: 'Smart Budget Tracking',
        description: 'Track expenses by category with visual insights',
        details: [
          'Category breakdown (food, activities, transport)',
          'Real-time budget remaining',
          'Daily spending averages',
          'Overage alerts and warnings'
        ]
      },
      {
        icon: BarChart3,
        title: 'Visual Analytics',
        description: 'See where your money goes with beautiful charts',
        details: [
          'Spending trends over time',
          'Category pie charts',
          'Budget vs actual comparison',
          'Export reports as PDF'
        ]
      },
      {
        icon: Users,
        title: 'Group Expense Splitting',
        description: 'Easy expense sharing for group trips',
        details: [
          'Split costs fairly',
          'Track who owes whom',
          'Multiple currency support',
          'Settlement suggestions'
        ]
      }
    ]
  },
  {
    title: 'Packing & Preparation',
    description: 'Never forget anything with smart packing lists',
    icon: Package,
    color: 'from-orange-500/10 to-red-500/10 border-orange-500/20',
    features: [
      {
        icon: Brain,
        title: 'AI-Generated Packing Lists',
        description: 'Get personalized lists based on your trip details',
        details: [
          'Weather-aware clothing suggestions',
          'Activity-specific gear',
          'Destination requirements',
          'Season-appropriate items'
        ]
      },
      {
        icon: Check,
        title: 'Interactive Checklists',
        description: 'Track your packing progress with ease',
        details: [
          'Category organization',
          'Progress tracking',
          'Custom item additions',
          'Quantity management'
        ]
      },
      {
        icon: Users,
        title: 'Shared Packing Items',
        description: 'Coordinate shared items for group trips',
        details: [
          'Assign items to travelers',
          'Avoid duplicates',
          'Share lists with travel companions',
          'Real-time sync'
        ]
      }
    ]
  },
  {
    title: 'Transport & Logistics',
    description: 'Comprehensive transport planning and tracking',
    icon: Plane,
    color: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20',
    features: [
      {
        icon: Navigation,
        title: 'Multi-Modal Transport',
        description: 'Track all types of transportation in one place',
        details: [
          'Flights with real-time updates',
          'Train and bus schedules',
          'Car rental management',
          'Ferry and cruise tracking'
        ]
      },
      {
        icon: Clock,
        title: 'Timeline Visualization',
        description: 'See your entire journey at a glance',
        details: [
          'Visual transport timeline',
          'Connection time warnings',
          'Overnight journey support',
          'Booking reference storage'
        ]
      },
      {
        icon: FileText,
        title: 'Document Storage',
        description: 'Keep all travel documents organized',
        details: [
          'Boarding pass storage',
          'Visa and passport info',
          'Insurance documents',
          'Offline access'
        ]
      }
    ]
  },
  {
    title: 'Collaboration & Sharing',
    description: 'Plan together and share your adventures',
    icon: Share2,
    color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20',
    features: [
      {
        icon: Globe,
        title: 'Trip Sharing',
        description: 'Share your itinerary with friends and family',
        details: [
          'Secure shareable links',
          'Read-only public views',
          'Mobile-optimized sharing',
          'No login required to view'
        ]
      },
      {
        icon: Camera,
        title: 'Photo Memories',
        description: 'Create beautiful trip galleries',
        details: [
          'Upload photos by day/activity',
          'Location tagging',
          'Caption and describe moments',
          'Create shareable albums'
        ]
      },
      {
        icon: Inbox,
        title: 'Travel Inbox',
        description: 'Save inspiration from anywhere on the web',
        details: [
          'Browser extension',
          'Email integration',
          'Automatic categorization',
          'Convert to trip activities'
        ]
      }
    ]
  },
  {
    title: 'Expert Marketplace',
    description: 'Connect with travel professionals',
    icon: Store,
    color: 'from-teal-500/10 to-cyan-500/10 border-teal-500/20',
    features: [
      {
        icon: UserCheck,
        title: 'Verified Experts',
        description: 'Work with trusted travel professionals',
        details: [
          'Background-checked experts',
          'Specialized destination knowledge',
          'Custom itinerary creation',
          'One-on-one consultations'
        ]
      },
      {
        icon: Mountain,
        title: 'Curated Experiences',
        description: 'Discover expert-recommended activities',
        details: [
          'Hidden gems and local favorites',
          'Exclusive experiences',
          'Expert tips and insights',
          'Seasonal recommendations'
        ]
      },
      {
        icon: Shield,
        title: 'Secure Transactions',
        description: 'Safe payments through Stripe',
        details: [
          'Secure payment processing',
          'Money-back guarantee',
          'Direct expert communication',
          'Review and rating system'
        ]
      }
    ]
  },
  {
    title: 'Platform & Security',
    description: 'Modern technology for the best experience',
    icon: Zap,
    color: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20',
    features: [
      {
        icon: Smartphone,
        title: 'Multi-Platform Access',
        description: 'Use NovaTrek anywhere, anytime',
        details: [
          'Responsive web app',
          'iOS app (coming soon)',
          'Android app (coming soon)',
          'Offline mode support'
        ]
      },
      {
        icon: Lock,
        title: 'Privacy & Security',
        description: 'Your data is safe with us',
        details: [
          'End-to-end encryption',
          'GDPR compliant',
          'Anonymous preference sharing',
          'Secure Firebase backend'
        ]
      },
      {
        icon: Palette,
        title: 'Beautiful Interface',
        description: 'Intuitive design that\'s a joy to use',
        details: [
          'Light and dark themes',
          'Accessible design',
          'Fast performance',
          'Real-time updates'
        ]
      }
    ]
  }
]

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Everything You Need for Perfect Trip Planning
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          From AI-powered itineraries to real-time weather integration, discover all the features 
          that make NovaTrek the most comprehensive travel planning platform.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { number: '50+', label: 'Features' },
          { number: '3', label: 'AI Models' },
          { number: '24/7', label: 'Support' },
          { number: '100%', label: 'Secure' }
        ].map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Categories */}
      <div className="space-y-24">
        {featureCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            {/* Category Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color}`}>
                <category.icon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{category.title}</h2>
                <p className="text-lg text-muted-foreground">{category.description}</p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {category.features.map((feature, featureIndex) => (
                <Card key={featureIndex} className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <feature.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-24 text-center">
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="py-12">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Experience These Features?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who are already planning smarter trips with NovaTrek.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter */}
      <div className="mt-16">
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Get notified when we launch new features
            </p>
            <Link href="/changelog">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Changelog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}