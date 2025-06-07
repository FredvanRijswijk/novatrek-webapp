import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { resolve, join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

// Initialize Firebase Admin
let db: ReturnType<typeof getFirestore>

try {
  if (getApps().length === 0) {
    // Try to find the service account file
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE,
      'novatrek-dev-firebase-adminsdk.json',
      './novatrek-dev-firebase-adminsdk.json',
      join(process.cwd(), 'novatrek-dev-firebase-adminsdk.json'),
      join(__dirname, '../novatrek-dev-firebase-adminsdk.json')
    ].filter(Boolean) as string[]
    
    let serviceAccount
    for (const path of possiblePaths) {
      try {
        const fileContent = readFileSync(path, 'utf8')
        serviceAccount = JSON.parse(fileContent)
        console.log(`Found service account file at: ${path}`)
        break
      } catch (e) {
        // Continue to next path
      }
    }
    
    if (!serviceAccount) {
      throw new Error('Could not find Firebase service account file')
    }
    
    initializeApp({
      credential: cert(serviceAccount)
    })
  }
  
  db = getFirestore()
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
  process.exit(1)
}

interface Category {
  title: string
  description: string
  icon: string
  order: number
}

interface Article {
  categoryId?: string
  title: string
  slug: string
  content: string
  excerpt: string
  keywords: string[]
  featured: boolean
  status: 'draft' | 'published'
  author: string
}

const categories: Category[] = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of using NovaTrek for your travel planning',
    icon: 'getting-started',
    order: 1
  },
  {
    title: 'Travel Planning',
    description: 'Master the art of planning perfect trips with our tools',
    icon: 'travel-planning',
    order: 2
  },
  {
    title: 'Marketplace',
    description: 'Buy and sell travel products, templates, and services',
    icon: 'marketplace',
    order: 3
  },
  {
    title: 'Payments & Billing',
    description: 'Manage subscriptions, payments, and billing information',
    icon: 'payments',
    order: 4
  },
  {
    title: 'Account & Settings',
    description: 'Configure your account, preferences, and security',
    icon: 'account',
    order: 5
  },
  {
    title: 'Troubleshooting',
    description: 'Find solutions to common issues and problems',
    icon: 'troubleshooting',
    order: 6
  }
]

async function setupHelpContent() {
  console.log('Setting up help content...')

  try {
    // Create categories
    const categoryMap: Record<string, string> = {}
    
    for (const category of categories) {
      const docRef = db.collection('help_categories').doc()
      await docRef.set({
        ...category,
        articleCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      categoryMap[category.title] = docRef.id
      console.log(`Created category: ${category.title}`)
    }

    // Create articles
    const articles: Article[] = [
      {
        title: 'Welcome to NovaTrek',
        slug: 'getting-started-novatrek',
        excerpt: 'Get started with NovaTrek and learn how to plan your perfect trip',
        content: `# Welcome to NovaTrek

NovaTrek is your AI-powered travel planning companion that helps you create perfect trips tailored to your preferences.

## Quick Start Guide

### 1. Create Your Account
Sign up with Google or email to get started. Your account gives you access to:
- Personal trip planning
- AI travel assistant
- Travel marketplace
- Itinerary builder

### 2. Set Up Your Travel Profile
Tell us about your travel preferences:
- **Travel Style**: Budget backpacker to luxury traveler
- **Interests**: Adventure, culture, food, relaxation, and more
- **Dietary Preferences**: Accommodations for any dietary needs
- **Accessibility**: Special requirements for comfortable travel

### 3. Plan Your First Trip
Use our trip creation wizard to:
- Choose single or multiple destinations
- Set your travel dates
- Define your budget
- Get AI-powered recommendations

### 4. Explore Features
- **AI Chat**: Get instant travel advice and recommendations
- **Itinerary Builder**: Create day-by-day plans
- **Travel Inbox**: Save ideas and inspirations
- **Marketplace**: Find travel experts and products

## Need Help?
- Browse our help articles
- Contact support
- Join the community

Welcome aboard! Let's make your travel dreams a reality.`,
        keywords: ['getting started', 'welcome', 'new user', 'tutorial', 'guide'],
        featured: true,
        status: 'published',
        author: 'NovaTrek Team'
      },
      {
        title: 'Creating Your First Trip',
        slug: 'create-first-trip',
        excerpt: 'Step-by-step guide to planning your first trip with NovaTrek',
        content: `# Creating Your First Trip

Planning a trip with NovaTrek is easy and intuitive. Follow this guide to create your first trip.

## Trip Creation Process

### Step 1: Choose Your Destinations
- Click "New Trip" from your dashboard
- Select single or multiple destinations
- Use our search to find cities, regions, or countries

### Step 2: Set Your Dates
- Choose flexible or fixed dates
- Add date ranges for each destination
- Let AI optimize your travel schedule

### Step 3: Define Your Travel Style
- Select your preferred pace (relaxed, moderate, packed)
- Choose accommodation preferences
- Set activity interests

### Step 4: Set Your Budget
- Total trip budget or daily spending
- Allocate budgets by category
- Get cost estimates for your destinations

## AI Assistance

Our AI assistant helps throughout:
- Suggests destinations based on preferences
- Recommends optimal travel routes
- Provides activity suggestions
- Estimates realistic budgets

## Tips for Success
- Be specific about your interests
- Consider weather and seasons
- Leave room for spontaneity
- Save multiple trip versions

Start planning your adventure today!`,
        keywords: ['trip planning', 'create trip', 'destinations', 'travel wizard'],
        featured: true,
        status: 'published',
        author: 'NovaTrek Team'
      },
      {
        title: 'Using the AI Travel Assistant',
        slug: 'ai-travel-assistant',
        excerpt: 'Get the most out of our AI-powered travel recommendations',
        content: `# Using the AI Travel Assistant

Our AI assistant is your personal travel expert, available 24/7 to help plan your perfect trip.

## How It Works

The AI uses:
- Your travel preferences
- Trip context and destinations
- Real-time data
- Expert travel knowledge

## Getting Started

### 1. Access the AI Chat
- Click "AI Assistant" in the sidebar
- Or use the chat icon on any page

### 2. Ask Anything
- "What should I do in Paris for 3 days?"
- "Find vegetarian restaurants in Tokyo"
- "Best time to visit New Zealand"
- "Create a romantic itinerary for Rome"

### 3. Refine Recommendations
- Ask follow-up questions
- Request alternatives
- Specify preferences

## Pro Tips

### Be Specific
- Include dates, budget, interests
- Mention group size and ages
- Note any special requirements

### Use Context
- Reference your saved trips
- Mention previous conversations
- Build on recommendations

### Save Ideas
- Copy suggestions to your itinerary
- Save recommendations to Travel Inbox
- Export chat history

## Advanced Features
- Multi-language support
- Real-time weather integration
- Local event recommendations
- Budget optimization

Make the most of your AI travel companion!`,
        keywords: ['AI', 'assistant', 'chat', 'recommendations', 'tips'],
        featured: true,
        status: 'published',
        author: 'NovaTrek Team'
      },
      {
        title: 'Becoming a Travel Expert',
        slug: 'become-travel-expert',
        excerpt: 'Join our marketplace and share your travel expertise',
        content: `# Becoming a Travel Expert

Share your travel knowledge and earn by becoming a NovaTrek Expert.

## What is a Travel Expert?

Travel Experts create and sell:
- Custom itineraries
- Travel guides
- Consultation services
- Trip templates
- Local experiences

## Requirements

### Expertise
- Deep knowledge of specific destinations
- Proven travel experience
- Unique insights or specializations

### Quality Standards
- Professional content
- Accurate information
- Responsive communication
- Customer focus

## How to Apply

### 1. Prepare Your Application
- Travel credentials
- Portfolio samples
- Areas of expertise
- Service offerings

### 2. Submit Application
- Go to "Become an Expert"
- Complete the application form
- Upload supporting documents
- Accept terms and conditions

### 3. Onboarding Process
- Application review (2-3 days)
- Stripe Connect setup
- Profile creation
- First product listing

## Earning Potential

### Pricing Your Services
- Research market rates
- Start competitive
- Build reputation
- Increase prices with demand

### Platform Fees
- 15% commission on sales
- No listing fees
- No monthly charges
- Instant payouts available

## Success Tips
- Specialize in specific niches
- Provide exceptional value
- Build customer relationships
- Continuously update offerings

Start your journey as a Travel Expert today!`,
        keywords: ['expert', 'marketplace', 'sell', 'earn', 'travel expert'],
        featured: false,
        status: 'published',
        author: 'NovaTrek Team'
      },
      {
        title: 'Managing Your Subscription',
        slug: 'subscription-management',
        excerpt: 'Understanding plans, billing, and subscription features',
        content: `# Managing Your Subscription

NovaTrek offers flexible subscription plans to match your travel planning needs.

## Available Plans

### Free Plan
- 3 trips per month
- Basic AI assistance
- Standard features

### Basic Plan ($9.99/month)
- Unlimited trips
- Enhanced AI features
- Priority support
- Export options

### Pro Plan ($19.99/month)
- Everything in Basic
- Advanced AI models
- Team collaboration
- API access
- Custom integrations

## Managing Your Plan

### Upgrade or Downgrade
1. Go to Settings > Billing
2. Select new plan
3. Confirm changes
4. Immediate access to features

### Billing Cycle
- Monthly or annual billing
- 20% discount on annual plans
- Automatic renewal
- Cancel anytime

## Payment Methods
- Credit/debit cards
- Stripe secure processing
- Update payment info anytime
- Automatic retry for failures

## Cancellation Policy
- Cancel anytime
- Access until period ends
- Data preserved for 90 days
- Easy reactivation

## FAQs

**When do upgrades take effect?**
Immediately upon payment confirmation.

**Can I switch between monthly and annual?**
Yes, with prorated adjustments.

**What happens to my data if I cancel?**
Preserved for 90 days, then archived.

Questions? Contact support@novatrek.com`,
        keywords: ['subscription', 'billing', 'payment', 'plans', 'pricing'],
        featured: false,
        status: 'published',
        author: 'NovaTrek Team'
      },
      {
        title: 'Travel Preferences Guide',
        slug: 'travel-preferences-setup',
        excerpt: 'Customize your travel profile for personalized recommendations',
        content: `# Travel Preferences Guide

Set up your travel preferences to get personalized recommendations and better trip planning.

## Why Preferences Matter

Your preferences help us:
- Suggest perfect destinations
- Recommend suitable activities
- Find ideal accommodations
- Match you with travel companions

## Setting Up Preferences

### Travel Style
- **Budget**: Backpacker to luxury
- **Pace**: Relaxed to action-packed
- **Planning**: Spontaneous to structured
- **Group**: Solo to large groups

### Interests & Activities
- Adventure & outdoors
- Arts & culture
- Food & culinary
- History & heritage
- Nature & wildlife
- Relaxation & wellness
- Shopping & markets
- Sports & fitness

### Accommodation
- Hotels vs. hostels
- Airbnb vs. resorts
- Location preferences
- Amenity requirements

### Dietary Preferences
- Vegetarian/vegan
- Allergies
- Religious restrictions
- Food preferences

### Accessibility
- Mobility requirements
- Medical needs
- Language preferences
- Special accommodations

## Privacy & Sharing

### Your Data
- Stored securely
- Never sold
- Used only for recommendations
- Deletable anytime

### Sharing Options
- Anonymous group planning
- Share with travel companions
- Export preferences
- Control visibility

Update your preferences anytime to improve recommendations!`,
        keywords: ['preferences', 'profile', 'personalization', 'settings'],
        featured: false,
        status: 'published',
        author: 'NovaTrek Team'
      }
    ]

    // Assign categories and create articles
    for (const article of articles) {
      // Assign category based on content
      if (article.slug.includes('getting-started') || article.slug.includes('first-trip')) {
        article.categoryId = categoryMap['Getting Started']
      } else if (article.slug.includes('ai') || article.slug.includes('assistant')) {
        article.categoryId = categoryMap['Travel Planning']
      } else if (article.slug.includes('expert') || article.slug.includes('marketplace')) {
        article.categoryId = categoryMap['Marketplace']
      } else if (article.slug.includes('subscription') || article.slug.includes('billing')) {
        article.categoryId = categoryMap['Payments & Billing']
      } else if (article.slug.includes('preferences') || article.slug.includes('profile')) {
        article.categoryId = categoryMap['Account & Settings']
      }

      if (article.categoryId) {
        const docRef = db.collection('help_articles').doc()
        await docRef.set({
          ...article,
          views: 0,
          helpful: 0,
          notHelpful: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })

        // Update category article count
        await db.collection('help_categories').doc(article.categoryId).update({
          articleCount: FieldValue.increment(1)
        })

        console.log(`Created article: ${article.title}`)
      }
    }

    console.log('\nHelp content setup complete!')
    console.log(`Created ${categories.length} categories and ${articles.length} articles`)

  } catch (error) {
    console.error('Error setting up help content:', error)
    process.exit(1)
  }
}

// Run the setup
setupHelpContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })