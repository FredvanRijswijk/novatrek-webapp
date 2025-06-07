'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HelpModel, HelpSearchResult } from '@/lib/models/help'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  ChevronLeft,
  Filter,
  FileText,
  Clock,
  Eye,
  ThumbsUp,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  
  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<HelpSearchResult[]>([])
  const [filteredResults, setFilteredResults] = useState<HelpSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  useEffect(() => {
    filterResults()
  }, [results, selectedCategory])

  const performSearch = async (searchTerm: string) => {
    setLoading(true)
    try {
      const searchResults = await HelpModel.searchArticles(searchTerm)
      setResults(searchResults)
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(searchResults.map(r => JSON.stringify({ 
          id: r.category.id, 
          title: r.category.title 
        })))
      ).map(str => JSON.parse(str))
      
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResults = () => {
    if (selectedCategory === 'all') {
      setFilteredResults(results)
    } else {
      setFilteredResults(results.filter(r => r.category.id === selectedCategory))
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark> : 
        part
    )
  }

  const getHelpfulPercentage = (article: HelpSearchResult['article']) => {
    const total = article.helpful + article.notHelpful
    return total > 0 ? Math.round((article.helpful / total) * 100) : 0
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
          
          <h1 className="text-3xl font-bold mb-4">Search Results</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-2"
              disabled={loading}
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Results Summary and Filters */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Found {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} 
                for "{query}"
              </p>
              
              {categories.length > 1 && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Search Results */}
            {filteredResults.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try searching with different keywords or browse categories
                  </p>
                  <Button onClick={() => router.push('/help')}>
                    Browse Categories
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredResults.map(({ article, category, relevance }) => {
                  const helpfulPercentage = getHelpfulPercentage(article)
                  
                  return (
                    <Link key={article.id} href={`/help/article/${article.slug}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {category.title}
                                </Badge>
                                {article.featured && (
                                  <Badge variant="secondary" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg">
                                {highlightText(article.title, query)}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {highlightText(article.excerpt, query)}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="ml-4">
                              <FileText className="h-3 w-3 mr-1" />
                              Article
                            </Badge>
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
                              {article.keywords
                                .filter(keyword => 
                                  keyword.toLowerCase().includes(query.toLowerCase())
                                )
                                .slice(0, 3)
                                .map((keyword) => (
                                  <Badge key={keyword} variant="outline" className="text-xs">
                                    {highlightText(keyword, query)}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Try Another Search */}
            <Card className="mt-8 bg-muted/50">
              <CardContent className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Can't find what you're looking for?
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => router.push('/help')}>
                    Browse Categories
                  </Button>
                  <Button asChild>
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}