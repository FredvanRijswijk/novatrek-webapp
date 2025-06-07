import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore'

export interface HelpCategory {
  id: string
  title: string
  description: string
  icon: string // Lucide icon name
  order: number
  articleCount: number
  createdAt: Date
  updatedAt: Date
}

export interface HelpArticle {
  id: string
  categoryId: string
  title: string
  slug: string
  content: string // Markdown content
  excerpt: string
  keywords: string[]
  relatedArticles?: string[] // Article IDs
  views: number
  helpful: number
  notHelpful: number
  featured: boolean
  status: 'draft' | 'published'
  author: string
  createdAt: Date
  updatedAt: Date
  lastReviewedAt?: Date
}

export interface HelpSearchResult {
  article: HelpArticle
  category: HelpCategory
  relevance: number
}

export interface ArticleFeedback {
  id: string
  articleId: string
  userId?: string
  helpful: boolean
  comment?: string
  createdAt: Date
}

export class HelpModel {
  // Categories
  static async createCategory(data: Omit<HelpCategory, 'id' | 'createdAt' | 'updatedAt' | 'articleCount'>): Promise<HelpCategory> {
    const categoryRef = doc(collection(db, 'help_categories'))
    const category: HelpCategory = {
      ...data,
      id: categoryRef.id,
      articleCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await setDoc(categoryRef, {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return category
  }

  static async getCategory(categoryId: string): Promise<HelpCategory | null> {
    const categoryDoc = await getDoc(doc(db, 'help_categories', categoryId))
    if (!categoryDoc.exists()) return null
    
    const data = categoryDoc.data()
    return {
      id: categoryDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as HelpCategory
  }

  static async getAllCategories(): Promise<HelpCategory[]> {
    const q = query(collection(db, 'help_categories'), orderBy('order'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as HelpCategory
    })
  }

  // Articles
  static async createArticle(data: Omit<HelpArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'>): Promise<HelpArticle> {
    const articleRef = doc(collection(db, 'help_articles'))
    const article: HelpArticle = {
      ...data,
      id: articleRef.id,
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await setDoc(articleRef, {
      ...article,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Update category article count
    await updateDoc(doc(db, 'help_categories', data.categoryId), {
      articleCount: increment(1)
    })
    
    return article
  }

  static async updateArticle(articleId: string, data: Partial<HelpArticle>): Promise<void> {
    await updateDoc(doc(db, 'help_articles', articleId), {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  static async getArticle(articleId: string): Promise<HelpArticle | null> {
    const articleDoc = await getDoc(doc(db, 'help_articles', articleId))
    if (!articleDoc.exists()) return null
    
    const data = articleDoc.data()
    return {
      id: articleDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastReviewedAt: data.lastReviewedAt?.toDate()
    } as HelpArticle
  }

  static async getArticleBySlug(slug: string): Promise<HelpArticle | null> {
    const q = query(collection(db, 'help_articles'), where('slug', '==', slug), where('status', '==', 'published'))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastReviewedAt: data.lastReviewedAt?.toDate()
    } as HelpArticle
  }

  static async getArticlesByCategory(categoryId: string, includeUnpublished = false): Promise<HelpArticle[]> {
    let q = query(
      collection(db, 'help_articles'), 
      where('categoryId', '==', categoryId),
      orderBy('title')
    )
    
    if (!includeUnpublished) {
      q = query(
        collection(db, 'help_articles'), 
        where('categoryId', '==', categoryId),
        where('status', '==', 'published'),
        orderBy('title')
      )
    }
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastReviewedAt: data.lastReviewedAt?.toDate()
      } as HelpArticle
    })
  }

  static async getFeaturedArticles(limit = 5): Promise<HelpArticle[]> {
    const q = query(
      collection(db, 'help_articles'),
      where('featured', '==', true),
      where('status', '==', 'published'),
      orderBy('views', 'desc'),
      firestoreLimit(limit)
    )
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastReviewedAt: data.lastReviewedAt?.toDate()
      } as HelpArticle
    })
  }

  // Article tracking
  static async incrementArticleView(articleId: string): Promise<void> {
    await updateDoc(doc(db, 'help_articles', articleId), {
      views: increment(1)
    })
  }

  static async recordArticleFeedback(articleId: string, helpful: boolean, userId?: string, comment?: string): Promise<void> {
    // Record individual feedback
    const feedbackRef = doc(collection(db, 'help_feedback'))
    const feedbackData: any = {
      articleId,
      helpful,
      createdAt: serverTimestamp()
    }
    
    // Only add optional fields if they have values
    if (userId) feedbackData.userId = userId
    if (comment) feedbackData.comment = comment
    
    await setDoc(feedbackRef, feedbackData)

    // Update article stats
    await updateDoc(doc(db, 'help_articles', articleId), {
      [helpful ? 'helpful' : 'notHelpful']: increment(1)
    })
  }

  // Search
  static async searchArticles(searchTerm: string): Promise<HelpSearchResult[]> {
    // In a real implementation, you might use Algolia or ElasticSearch
    // For now, we'll do client-side filtering
    const [articles, categories] = await Promise.all([
      getDocs(query(collection(db, 'help_articles'), where('status', '==', 'published'))),
      this.getAllCategories()
    ])

    const searchLower = searchTerm.toLowerCase()
    const results: HelpSearchResult[] = []

    articles.forEach(doc => {
      const article = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as HelpArticle

      // Calculate relevance score
      let relevance = 0
      
      // Title match (highest weight)
      if (article.title.toLowerCase().includes(searchLower)) {
        relevance += 10
      }
      
      // Keywords match (high weight)
      if (article.keywords.some(k => k.toLowerCase().includes(searchLower))) {
        relevance += 7
      }
      
      // Content match (medium weight)
      if (article.content.toLowerCase().includes(searchLower)) {
        relevance += 5
      }
      
      // Excerpt match (low weight)
      if (article.excerpt.toLowerCase().includes(searchLower)) {
        relevance += 3
      }

      if (relevance > 0) {
        const category = categories.find(c => c.id === article.categoryId)!
        results.push({ article, category, relevance })
      }
    })

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance)
  }

  // Related articles
  static async getRelatedArticles(articleId: string, limit = 3): Promise<HelpArticle[]> {
    const article = await this.getArticle(articleId)
    if (!article) return []

    // Get articles from same category
    const categoryArticles = await this.getArticlesByCategory(article.categoryId)
    
    // Filter out current article and limit
    return categoryArticles
      .filter(a => a.id !== articleId)
      .slice(0, limit)
  }
}