'use client'

import { useState, useEffect } from 'react'
import { HelpModel, HelpCategory, HelpArticle } from '@/lib/models/help'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  BookOpen, 
  Users, 
  CreditCard, 
  Package, 
  Settings,
  HelpCircle,
  Compass,
  Shield,
  Zap,
  MessageCircle,
  ChevronRight,
  TrendingUp,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, any> = {
  'getting-started': Compass,
  'travel-planning': BookOpen,
  'marketplace': Package,
  'payments': CreditCard,
  'experts': Users,
  'account': Settings,
  'safety': Shield,
  'troubleshooting': HelpCircle
}

export default function HelpCenterPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<HelpArticle[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadHelpContent()
  }, [])

  const loadHelpContent = async () => {
    try {
      const [categoriesData, featuredData] = await Promise.all([
        HelpModel.getAllCategories(),
        HelpModel.getFeaturedArticles(6)
      ])
      
      setCategories(categoriesData)
      setFeaturedArticles(featuredData)
    } catch (error) {
      console.error('Error loading help content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const results = await HelpModel.searchArticles(searchQuery)
      setSearchResults(results)
      router.push(`/help/search?q=${encodeURIComponent(searchQuery)}`)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const getCategoryIcon = (iconName: string) => {
    const Icon = CATEGORY_ICONS[iconName] || HelpCircle
    return <Icon className="h-6 w-6" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Search our knowledge base or browse categories below
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-2"
                disabled={searching}
              >
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Link href="/help/article/getting-started-novatrek">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Getting Started</p>
                  <p className="text-sm text-muted-foreground">New to NovaTrek?</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/help/article/become-travel-expert">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Become an Expert</p>
                  <p className="text-sm text-muted-foreground">Sell on marketplace</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/help/article/payment-methods">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Payments</p>
                  <p className="text-sm text-muted-foreground">Billing & subscriptions</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/contact">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Contact Us</p>
                  <p className="text-sm text-muted-foreground">Still need help?</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/help/category/${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {getCategoryIcon(category.icon)}
                      </div>
                      <Badge variant="secondary">{category.articleCount} articles</Badge>
                    </div>
                    <CardTitle className="mt-4">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="p-0 h-auto">
                      Browse Articles
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        {featuredArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
            <div className="grid gap-4">
              {featuredArticles.map((article) => (
                <Link key={article.id} href={`/help/article/${article.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{article.title}</p>
                          <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{article.views} views</Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to assist you
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help/article/community-forum">Community Forum</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}