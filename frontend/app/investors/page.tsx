'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { track } from '@vercel/analytics'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { FeatureFlag } from '@/components/feature-flag/FeatureFlag'
import { notFound } from 'next/navigation'
import { 
  TrendingUp, 
  Users, 
  Globe, 
  Zap,
  DollarSign,
  Target,
  Rocket,
  Shield,
  Award,
  BarChart3,
  ArrowRight,
  Building,
  Sparkles,
  CheckCircle,
  Calendar,
  Mail,
  FileText,
  Download,
  Play
} from 'lucide-react'

// Metadata is handled in layout.tsx

const metrics = [
  {
    label: 'Monthly Active Users',
    value: '10,000+',
    growth: '+156%',
    description: 'YoY Growth'
  },
  {
    label: 'Total Bookings',
    value: '$2.5M',
    growth: '+312%',
    description: 'GMV Last Quarter'
  },
  {
    label: 'Expert Network',
    value: '500+',
    growth: '+89%',
    description: 'Verified Experts'
  },
  {
    label: 'User Retention',
    value: '78%',
    growth: '+23%',
    description: '6-Month Retention'
  }
]

const milestones = [
  {
    date: 'Q1 2023',
    title: 'Company Founded',
    description: 'NovaTrek incorporated with initial seed funding'
  },
  {
    date: 'Q3 2023',
    title: '€1.5M Seed Round',
    description: 'Led by prominent Silicon Valley angels'
  },
  {
    date: 'Q1 2024',
    title: 'AI Platform Launch',
    description: 'Released GPT-4 powered travel assistant'
  },
  {
    date: 'Q2 2024',
    title: 'Marketplace Launch',
    description: 'Connected travelers with expert network'
  },
  {
    date: 'Q4 2024',
    title: '10K Active Users',
    description: 'Achieved product-market fit milestone'
  },
  {
    date: 'Q1 2025',
    title: 'Series A (Raising)',
    description: 'Targeting €10M to scale globally'
  }
]

const investors = [
  {
    name: 'Innovation Ventures',
    type: 'Seed Lead',
    logo: '/investors/innovation-ventures.png'
  },
  {
    name: 'Travel Tech Fund',
    type: 'Seed',
    logo: '/investors/travel-tech-fund.png'
  },
  {
    name: 'AI Capital Partners',
    type: 'Seed',
    logo: '/investors/ai-capital.png'
  },
  {
    name: 'Former Airbnb Executive',
    type: 'Angel',
    logo: null
  },
  {
    name: 'Former Google Travel Lead',
    type: 'Angel',
    logo: null
  }
]

const advantages = [
  {
    icon: Sparkles,
    title: 'AI-First Approach',
    description: 'Proprietary AI models trained on millions of trips, providing unmatched personalization and recommendations.'
  },
  {
    icon: Users,
    title: 'Network Effects',
    description: 'Two-sided marketplace connecting travelers with experts, creating strong network effects and high retention.'
  },
  {
    icon: Globe,
    title: 'Global Scalability',
    description: 'Platform architecture designed for international expansion with localized AI and expert networks.'
  },
  {
    icon: Shield,
    title: 'Defensible Moat',
    description: 'Combination of AI technology, expert network, and user data creates strong competitive advantages.'
  }
]

export default function InvestorsPage() {
  return (
    <FeatureFlag 
      feature="investorsPage" 
      fallback={notFound}
    >
      <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4" variant="outline">
              <Rocket className="w-3 h-3 mr-1" />
              Series A • Raising Now
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Invest in the Future of Travel
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              NovaTrek is building the world's most intelligent travel planning platform, 
              combining cutting-edge AI with human expertise to revolutionize how people explore the world.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => {
                  track('click', { button: 'contact_investor_relations', page: 'investors' })
                }}
                asChild
              >
                <a href="mailto:investors@novatrek.app">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Investor Relations
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => {
                  track('click', { button: 'download_pitch_deck', page: 'investors' })
                }}
                asChild
              >
                <a href="/pitch-deck.pdf" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Pitch Deck
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20 px-4 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Traction & Growth</h2>
            <p className="text-xl text-muted-foreground">
              Consistent growth across all key metrics
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardDescription>{metric.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{metric.value}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-green-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {metric.growth}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{metric.description}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                $1.9 Trillion Market Opportunity
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The global travel industry is experiencing unprecedented growth, with online 
                  travel bookings expected to reach $1.9 trillion by 2028. Yet, trip planning 
                  remains fragmented and time-consuming for most travelers.
                </p>
                <p>
                  NovaTrek addresses this massive pain point by offering an AI-powered platform 
                  that reduces planning time by 80% while increasing traveler satisfaction and 
                  booking values.
                </p>
                <p>
                  Our dual revenue model captures value from both travelers (subscriptions) and 
                  experts (marketplace fees), creating multiple growth vectors in a rapidly 
                  expanding market.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">$817B online travel market (2024)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">23% CAGR in AI travel tech</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">67% of travelers want AI assistance</span>
                </div>
              </div>
            </div>
            
            <Card className="p-8">
              <CardHeader className="text-center pb-8">
                <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Revenue Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">SaaS Subscriptions</span>
                    <span className="text-muted-foreground">60%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/5 bg-primary rounded-full" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    $9.99 - $29.99/month recurring revenue
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Marketplace Fees</span>
                    <span className="text-muted-foreground">35%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[35%] bg-primary rounded-full" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    15% commission on expert services
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Enterprise & API</span>
                    <span className="text-muted-foreground">5%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[5%] bg-primary rounded-full" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    White-label and API licensing
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Competitive Advantages
            </h2>
            <p className="text-xl text-muted-foreground">
              What sets NovaTrek apart in the market
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((advantage, index) => (
              <Card key={index}>
                <CardHeader>
                  <advantage.icon className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline & Milestones */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Growth Timeline
            </h2>
            <p className="text-xl text-muted-foreground">
              From inception to market leader
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Milestones */}
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        index === milestones.length - 1 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {index === milestones.length - 1 ? (
                          <Rocket className="w-6 h-6" />
                        ) : (
                          <CheckCircle className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 pb-8">
                      <Badge variant="outline" className="mb-2">{milestone.date}</Badge>
                      <h3 className="text-xl font-semibold mb-1">{milestone.title}</h3>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Investors */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Backed by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              Join our growing list of strategic investors
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
            {investors.map((investor, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  {investor.logo ? (
                    <div className="h-16 flex items-center justify-center mb-2">
                      <Building className="w-12 h-12 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center mb-2">
                      <Award className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <p className="font-medium">{investor.name}</p>
                  <p className="text-sm text-muted-foreground">{investor.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use of Funds */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Series A: $10M Target
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Accelerating growth through strategic investments in technology, 
                market expansion, and team scaling.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Product Development (40%)</p>
                    <p className="text-sm text-muted-foreground">
                      Enhance AI capabilities, mobile apps, and enterprise features
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Team Expansion (30%)</p>
                    <p className="text-sm text-muted-foreground">
                      Hire top talent in engineering, AI/ML, and growth
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Market Expansion (20%)</p>
                    <p className="text-sm text-muted-foreground">
                      Launch in Europe and Asia-Pacific markets
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Marketing & Growth (10%)</p>
                    <p className="text-sm text-muted-foreground">
                      Scale user acquisition and brand awareness
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Investment Terms</CardTitle>
                <CardDescription>Series A Fundraising Round</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Round Size</span>
                  <span className="font-medium">$10M</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Pre-Money Valuation</span>
                  <span className="font-medium">$40M</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Minimum Investment</span>
                  <span className="font-medium">$250K</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Lead Investor</span>
                  <span className="font-medium">In Discussion</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Expected Close</span>
                  <span className="font-medium">Q2 2025</span>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={() => {
                      track('click', { button: 'express_interest', page: 'investors' })
                    }}
                    asChild
                  >
                    <a href="mailto:investors@novatrek.app">
                      Express Interest
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Us in Shaping the Future of Travel
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of the next unicorn in travel technology. Limited allocation remaining for strategic investors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => {
                track('click', { button: 'schedule_call_cta', page: 'investors' })
              }}
              asChild
            >
              <a href="mailto:investors@novatrek.app">
                <Mail className="mr-2 h-4 w-4" />
                Schedule a Call
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
              onClick={() => {
                track('click', { button: 'full_investment_deck_cta', page: 'investors' })
              }}
              asChild
            >
              <a href="/investor-deck.pdf" download>
                <FileText className="mr-2 h-4 w-4" />
                Full Investment Deck
              </a>
            </Button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-primary-foreground/20">
            <p className="text-sm opacity-75">
              For investor relations inquiries: investors@novatrek.app | +1 (415) 555-0123
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
    </FeatureFlag>
  )
}