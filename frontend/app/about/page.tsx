'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { track } from '@vercel/analytics'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { 
  Plane, 
  Users, 
  Globe, 
  Sparkles, 
  Target,
  Rocket,
  Shield,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

// Metadata is handled in layout.tsx

const stats = [
  { label: 'Active Travelers', value: '10,000+' },
  { label: 'Trips Planned', value: '50,000+' },
  { label: 'Travel Experts', value: '500+' },
  { label: 'Countries Covered', value: '150+' }
]

const values = [
  {
    icon: Users,
    title: 'Community First',
    description: 'We believe travel is better when shared. Our platform connects travelers with experts and each other.'
  },
  {
    icon: Sparkles,
    title: 'Innovation',
    description: 'We leverage cutting-edge AI to provide personalized recommendations that evolve with your preferences.'
  },
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'Your security is paramount. We use bank-level encryption and verify all travel experts on our platform.'
  },
  {
    icon: Globe,
    title: 'Global Perspective',
    description: 'We celebrate diverse travel styles and destinations, making the world accessible to all types of travelers.'
  }
]

const timeline = [
  {
    year: '2024',
    title: 'The Beginning',
    description: 'NovaTrek was founded with a simple mission: make travel planning effortless using AI.'
  },
  {
    year: '2025 Q1',
    title: 'AI Integration',
    description: 'Launched our proprietary AI travel assistant powered by GPT-4 and Gemini models.'
  },
  {
    year: '2025 Q2',
    title: 'Expert Marketplace',
    description: 'Introduced the marketplace connecting travelers with verified travel experts worldwide.'
  },
  // {
  //   year: '2025 Q3',
  //   title: 'Group Travel Features',
  //   description: 'Released AI-powered group compromise engine for seamless multi-person trip planning.'
  // },
  // {
  //   year: '2025 Q4',
  //   title: 'Global Expansion',
  //   description: 'Expanded to 150+ countries with localized recommendations and expert coverage.'
  // }
]

const team = [
  {
    name: 'Fred van Rijswijk',
    role: 'Founder',
    bio: 'Former owner No Nasties and AttiqLab with a passion for sustainable travel.',
    image: '/team/fred.jpg'
  },
  // {
  //   name: 'Kirsten Rademaker',
  //   role: 'Co-Founder & CFO',
  //   bio: 'Former owner No Nasties with a passion for the world and travel.',
  //   image: '/team/kirsten.jpg'
  // }
]

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Redefining Travel Planning
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We&apos;re on a mission to make travel planning smarter, easier, and more personalized 
              using the power of AI and human expertise.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => {
                  track('click', { button: 'start_journey', page: 'about' })
                }}
                asChild
              >
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => {
                  track('click', { button: 'browse_experts', page: 'about' })
                }}
                asChild
              >
                <Link href="/marketplace">
                  Browse Experts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-b">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-muted-foreground">
            The journey to...
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  NovaTrek was born from a simple observation: planning a trip shouldn&apos;t be stressful. 
                  As avid travelers ourselves, we experienced firsthand the overwhelming process of 
                  researching destinations, comparing options, and coordinating with travel companions.
                </p>
                <p>
                  We realized that while AI was transforming industries, travel planning remained 
                  largely manual and fragmented. That&apos;s when we decided to build NovaTrek - a platform 
                  that combines the efficiency of AI with the irreplaceable value of human expertise.
                </p>
                <p>
                  Today, NovaTrek serves thousands of travelers worldwide, helping them create 
                  unforgettable experiences while saving time and reducing stress. Our AI learns from 
                  each interaction, continuously improving to provide even better recommendations.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <Plane className="w-32 h-32 text-primary/40" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg">
                <Sparkles className="w-8 h-8 mb-2" />
                <p className="font-semibold">AI-Powered</p>
                <p className="text-sm opacity-90">Since Day One</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mission & Vision</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We&apos;re building the future of travel planning, one trip at a time.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Target className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To democratize travel planning by making personalized, expert-level trip planning 
                  accessible to everyone through AI technology and a global community of travel experts.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Rocket className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A world where every traveler can effortlessly plan their perfect trip, discover 
                  hidden gems, and create lasting memories without the stress of planning.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <value.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground">
              From idea to global platform
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary-foreground" />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-20 bg-border mx-6 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="text-sm text-muted-foreground mb-1">{item.year}</div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">
              The passionate people building the future of travel
            </p>
          </div>
          
          <div className="flex justify-center">
            {team.map((member, index) => (
              <Card key={index} className="text-center max-w-sm">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Us on Our Journey
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you&apos;re a traveler seeking your next adventure or an expert ready to share 
            your knowledge, there&apos;s a place for you at NovaTrek.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => {
                track('click', { button: 'start_planning_cta', page: 'about' })
              }}
              asChild
            >
              <Link href="/signup">
                Start Planning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
              onClick={() => {
                track('click', { button: 'join_team_cta', page: 'about' })
              }}
              asChild
            >
              <Link href="/careers">
                Join Our Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}