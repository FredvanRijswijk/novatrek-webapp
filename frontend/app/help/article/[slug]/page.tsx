'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { HelpModel, HelpArticle, HelpCategory } from '@/lib/models/help'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Eye,
  Share2,
  Copy,
  CheckCircle,
  BookOpen,
  MessageSquare,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useFirebase } from '@/lib/firebase/context'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function HelpArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useFirebase()
  const slug = params.slug as string
  
  const [article, setArticle] = useState<HelpArticle | null>(null)
  const [category, setCategory] = useState<HelpCategory | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<HelpArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadArticle()
  }, [slug])

  const loadArticle = async () => {
    try {
      const articleData = await HelpModel.getArticleBySlug(slug)
      if (!articleData) {
        router.push('/help')
        return
      }

      setArticle(articleData)

      // Load category and related articles
      const [categoryData, relatedData] = await Promise.all([
        HelpModel.getCategory(articleData.categoryId),
        HelpModel.getRelatedArticles(articleData.id)
      ])

      setCategory(categoryData)
      setRelatedArticles(relatedData)

      // Track view
      await HelpModel.incrementArticleView(articleData.id)
    } catch (error) {
      console.error('Error loading article:', error)
      router.push('/help')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (helpful: boolean) => {
    if (!article) return

    try {
      await HelpModel.recordArticleFeedback(
        article.id,
        helpful,
        user?.uid,
        showFeedbackForm ? feedbackComment : undefined
      )
      
      setFeedbackGiven(helpful)
      toast.success('Thank you for your feedback!')
      
      if (showFeedbackForm) {
        setShowFeedbackForm(false)
        setFeedbackComment('')
      }
    } catch (error) {
      console.error('Error recording feedback:', error)
      toast.error('Failed to submit feedback')
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied to clipboard!')
  }

  const shareArticle = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.excerpt,
        url: window.location.href
      })
    } else {
      copyLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!article || !category) {
    return null
  }

  const helpfulPercentage = article.helpful + article.notHelpful > 0
    ? Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/help" className="text-muted-foreground hover:text-foreground">
              Help Center
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link 
              href={`/help/category/${category.id}`} 
              className="text-muted-foreground hover:text-foreground"
            >
              {category.title}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{article.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="mb-4"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={shareArticle}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyLink}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <CardTitle className="text-2xl mb-4">{article.title}</CardTitle>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {format(article.updatedAt, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.views} views</span>
                  </div>
                  {helpfulPercentage > 0 && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{helpfulPercentage}% found helpful</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Article Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none 
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                  prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-base prose-p:leading-7 prose-p:mb-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:mb-2
                  prose-strong:font-semibold prose-strong:text-foreground
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                  prose-a:text-primary prose-a:underline prose-a:font-medium hover:prose-a:text-primary/80
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => (
                        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl mt-8 mb-4">
                          {children}
                        </h1>
                      ),
                      h2: ({children}) => (
                        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4 first:mt-0">
                          {children}
                        </h2>
                      ),
                      h3: ({children}) => (
                        <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">
                          {children}
                        </h3>
                      ),
                      ul: ({children}) => (
                        <ul className="my-4 ml-6 list-disc [&>li]:mt-2">
                          {children}
                        </ul>
                      ),
                      ol: ({children}) => (
                        <ol className="my-4 ml-6 list-decimal [&>li]:mt-2">
                          {children}
                        </ol>
                      ),
                      li: ({children}) => (
                        <li className="leading-7">
                          {children}
                        </li>
                      ),
                      p: ({children}) => (
                        <p className="leading-7 [&:not(:first-child)]:mt-4 mb-4">
                          {children}
                        </p>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="mt-6 border-l-4 border-primary pl-6 italic">
                          {children}
                        </blockquote>
                      ),
                      code: ({children}) => (
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {children}
                        </code>
                      ),
                      pre: ({children}) => (
                        <pre className="mb-4 mt-6 overflow-x-auto rounded-lg bg-muted p-4">
                          {children}
                        </pre>
                      ),
                      strong: ({children}) => (
                        <strong className="font-semibold">
                          {children}
                        </strong>
                      ),
                      em: ({children}) => (
                        <em className="italic">
                          {children}
                        </em>
                      ),
                      a: ({href, children}) => (
                        <Link 
                          href={href || '#'} 
                          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                          {children}
                        </Link>
                      )
                    }}
                  >
                    {article.content}
                  </ReactMarkdown>
                </div>

                <Separator className="my-8" />

                {/* Feedback Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Was this article helpful?</h3>
                  
                  {feedbackGiven === null ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleFeedback(true)}
                        className="flex items-center gap-2"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Yes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowFeedbackForm(true)
                        }}
                        className="flex items-center gap-2"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        No
                      </Button>
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Thank you for your feedback! It helps us improve our documentation.
                      </AlertDescription>
                    </Alert>
                  )}

                  {showFeedbackForm && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Please tell us how we can improve this article..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleFeedback(false)}
                        >
                          Submit Feedback
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowFeedbackForm(false)
                            setFeedbackComment('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {article.keywords.length > 0 && (
                  <>
                    <Separator className="my-8" />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Related Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedArticles.map((related) => (
                      <Link
                        key={related.id}
                        href={`/help/article/${related.slug}`}
                        className="block hover:underline"
                      >
                        <p className="font-medium text-sm">{related.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {related.views} views
                        </p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Need More Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Can't find what you're looking for?
                </p>
                <Button className="w-full" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}