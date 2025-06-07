'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { HelpModel, HelpArticle, HelpCategory } from '@/lib/models/help'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ChevronLeft,
  Clock,
  Eye,
  ThumbsUp,
  Filter,
  Search,
  BookOpen,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

type SortOption = 'title' | 'views' | 'helpful' | 'date'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string
  
  const [category, setCategory] = useState<HelpCategory | null>(null)
  const [articles, setArticles] = useState<HelpArticle[]>([])
  const [sortedArticles, setSortedArticles] = useState<HelpArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('title')

  useEffect(() => {
    loadCategory()
  }, [categoryId])

  useEffect(() => {
    sortArticles()
  }, [articles, sortBy])

  const loadCategory = async () => {
    try {
      // Add a small delay to ensure Firebase is initialized
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const [categoryData, articlesData] = await Promise.all([
        HelpModel.getCategory(categoryId),
        HelpModel.getArticlesByCategory(categoryId)
      ])

      if (!categoryData) {
        router.push('/help')
        return
      }

      setCategory(categoryData)
      setArticles(articlesData)
    } catch (error: any) {
      console.error('Error loading category:', error)
      
      // If it's a permission error, retry once after a delay
      if (error?.code === 'permission-denied' && !loading) {
        console.log('Retrying after permission error...')
        setTimeout(() => {
          loadCategory()
        }, 500)
        return
      }
      
      router.push('/help')
    } finally {
      setLoading(false)
    }
  }

  const sortArticles = () => {
    const sorted = [...articles].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'views':
          return b.views - a.views
        case 'helpful':
          const aHelpful = a.helpful + a.notHelpful > 0 
            ? (a.helpful / (a.helpful + a.notHelpful)) 
            : 0
          const bHelpful = b.helpful + b.notHelpful > 0 
            ? (b.helpful / (b.helpful + b.notHelpful)) 
            : 0
          return bHelpful - aHelpful
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })
    setSortedArticles(sorted)
  }

  const getHelpfulPercentage = (article: HelpArticle) => {
    const total = article.helpful + article.notHelpful
    return total > 0 ? Math.round((article.helpful / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!category) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/help')}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">{category.title}</h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="date">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Articles List */}
        {sortedArticles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No articles in this category yet</p>
              <p className="text-sm text-muted-foreground">
                Check back soon or browse other categories
              </p>
              <Button className="mt-4" onClick={() => router.push('/help')}>
                Browse All Categories
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedArticles.map((article) => {
              const helpfulPercentage = getHelpfulPercentage(article)
              
              return (
                <Link key={article.id} href={`/help/article/${article.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {article.excerpt}
                          </CardDescription>
                        </div>
                        {article.featured && (
                          <Badge variant="secondary" className="ml-4">Featured</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.views} views</span>
                        </div>
                        {helpfulPercentage > 0 && (
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{helpfulPercentage}% helpful</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Updated {new Date(article.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {article.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.keywords.slice(0, 3).map((keyword) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {article.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{article.keywords.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Back to Help Center */}
        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => router.push('/help')}>
            Back to Help Center
          </Button>
        </div>
      </div>
    </div>
  )
}