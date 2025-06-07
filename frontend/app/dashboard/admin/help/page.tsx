'use client'

import { useState, useEffect } from 'react'
import { HelpModel, HelpCategory, HelpArticle } from '@/lib/models/help'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  BookOpen,
  FolderOpen,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useFirebase } from '@/lib/firebase/context'
import { AdminModel } from '@/lib/models/admin'
import ReactMarkdown from 'react-markdown'

interface ArticleForm {
  categoryId: string
  title: string
  slug: string
  content: string
  excerpt: string
  keywords: string
  featured: boolean
  status: 'draft' | 'published'
}

const initialArticleForm: ArticleForm = {
  categoryId: '',
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  keywords: '',
  featured: false,
  status: 'draft'
}

interface CategoryForm {
  title: string
  description: string
  icon: string
  order: number
}

const initialCategoryForm: CategoryForm = {
  title: '',
  description: '',
  icon: 'help-circle',
  order: 0
}

export default function AdminHelpPage() {
  const { user } = useFirebase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Categories
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  
  // Articles
  const [articles, setArticles] = useState<HelpArticle[]>([])
  const [articleForm, setArticleForm] = useState<ArticleForm>(initialArticleForm)
  const [editingArticle, setEditingArticle] = useState<string | null>(null)
  const [articleDialogOpen, setArticleDialogOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  // Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    checkAdminAndLoad()
  }, [user])

  const checkAdminAndLoad = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const adminStatus = await AdminModel.isAdmin(user.uid)
    setIsAdmin(adminStatus)
    
    if (adminStatus) {
      await loadData()
    }
    
    setLoading(false)
  }

  const loadData = async () => {
    try {
      const [categoriesData, articlesData] = await Promise.all([
        HelpModel.getAllCategories(),
        HelpModel.getArticlesByCategory('', true) // Get all articles including drafts
      ])
      
      setCategories(categoriesData)
      setArticles(articlesData)
    } catch (error) {
      console.error('Error loading help data:', error)
      toast.error('Failed to load help data')
    }
  }

  // Category handlers
  const handleCategorySubmit = async () => {
    try {
      if (editingCategory) {
        // Update category (would need to implement updateCategory method)
        toast.error('Category update not implemented yet')
      } else {
        await HelpModel.createCategory(categoryForm)
        toast.success('Category created successfully')
      }
      
      setCategoryDialogOpen(false)
      setCategoryForm(initialCategoryForm)
      setEditingCategory(null)
      await loadData()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    }
  }

  // Article handlers
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleArticleSubmit = async () => {
    try {
      const articleData = {
        ...articleForm,
        keywords: articleForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        author: user?.email || 'Admin'
      }

      if (editingArticle) {
        await HelpModel.updateArticle(editingArticle, articleData)
        toast.success('Article updated successfully')
      } else {
        await HelpModel.createArticle(articleData)
        toast.success('Article created successfully')
      }
      
      setArticleDialogOpen(false)
      setArticleForm(initialArticleForm)
      setEditingArticle(null)
      await loadData()
    } catch (error) {
      console.error('Error saving article:', error)
      toast.error('Failed to save article')
    }
  }

  const editArticle = (article: HelpArticle) => {
    setArticleForm({
      categoryId: article.categoryId,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      keywords: article.keywords.join(', '),
      featured: article.featured,
      status: article.status
    })
    setEditingArticle(article.id)
    setArticleDialogOpen(true)
  }

  const toggleArticleStatus = async (article: HelpArticle) => {
    try {
      await HelpModel.updateArticle(article.id, {
        status: article.status === 'published' ? 'draft' : 'published'
      })
      toast.success(`Article ${article.status === 'published' ? 'unpublished' : 'published'}`)
      await loadData()
    } catch (error) {
      console.error('Error toggling article status:', error)
      toast.error('Failed to update article status')
    }
  }

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.categoryId === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Help Center Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage help articles and categories
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">
              {articles.filter(a => a.status === 'published').length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.reduce((sum, a) => sum + a.helpful + a.notHelpful, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total responses
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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

            <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? 'Edit Article' : 'Create New Article'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={articleForm.categoryId} 
                        onValueChange={(value) => setArticleForm({...articleForm, categoryId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={articleForm.status} 
                        onValueChange={(value) => setArticleForm({...articleForm, status: value as 'draft' | 'published'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={articleForm.title}
                      onChange={(e) => {
                        const title = e.target.value
                        setArticleForm({
                          ...articleForm, 
                          title,
                          slug: generateSlug(title)
                        })
                      }}
                      placeholder="How to plan your first trip"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={articleForm.slug}
                      onChange={(e) => setArticleForm({...articleForm, slug: e.target.value})}
                      placeholder="how-to-plan-your-first-trip"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={articleForm.excerpt}
                      onChange={(e) => setArticleForm({...articleForm, excerpt: e.target.value})}
                      placeholder="A brief summary of the article..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Content (Markdown)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        {previewMode ? 'Edit' : 'Preview'}
                      </Button>
                    </div>
                    {previewMode ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md min-h-[300px]">
                        <ReactMarkdown>{articleForm.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <Textarea
                        id="content"
                        value={articleForm.content}
                        onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                        placeholder="Write your article content in Markdown..."
                        rows={12}
                        className="font-mono"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      value={articleForm.keywords}
                      onChange={(e) => setArticleForm({...articleForm, keywords: e.target.value})}
                      placeholder="travel, planning, tips, first-time"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={articleForm.featured}
                      onCheckedChange={(checked) => setArticleForm({...articleForm, featured: checked})}
                    />
                    <Label htmlFor="featured">Featured article</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setArticleDialogOpen(false)
                    setArticleForm(initialArticleForm)
                    setEditingArticle(null)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleArticleSubmit}>
                    {editingArticle ? 'Update' : 'Create'} Article
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Articles List */}
          <div className="rounded-md border">
            <div className="p-4">
              <div className="grid gap-4">
                {filteredArticles.map((article) => {
                  const category = categories.find(c => c.id === article.categoryId)
                  const helpfulPercentage = article.helpful + article.notHelpful > 0
                    ? Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)
                    : 0
                  
                  return (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {article.title}
                              {article.featured && (
                                <Badge variant="secondary">Featured</Badge>
                              )}
                              <Badge variant={article.status === 'published' ? 'default' : 'outline'}>
                                {article.status}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {category?.title} • {article.views} views • {helpfulPercentage}% helpful
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleArticleStatus(article)}
                            >
                              {article.status === 'published' ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editArticle(article)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <Link href={`/help/article/${article.slug}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-title">Title</Label>
                    <Input
                      id="cat-title"
                      value={categoryForm.title}
                      onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})}
                      placeholder="Getting Started"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-desc">Description</Label>
                    <Textarea
                      id="cat-desc"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      placeholder="Learn the basics of using NovaTrek..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-icon">Icon Name</Label>
                    <Input
                      id="cat-icon"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                      placeholder="help-circle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-order">Order</Label>
                    <Input
                      id="cat-order"
                      type="number"
                      value={categoryForm.order}
                      onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setCategoryDialogOpen(false)
                    setCategoryForm(initialCategoryForm)
                    setEditingCategory(null)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCategorySubmit}>
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories List */}
          <div className="rounded-md border">
            <div className="p-4">
              <div className="grid gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {category.title}
                          </CardTitle>
                          <CardDescription>
                            {category.description} • {category.articleCount} articles
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Order: {category.order}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}