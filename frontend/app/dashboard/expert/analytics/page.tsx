'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  ShoppingCart,
  Eye,
  Star,
  Clock,
  Users,
  Calendar,
  Download,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { MarketplaceModel, MarketplaceTransaction, MarketplaceProduct } from '@/lib/models/marketplace'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalViews: number
  averageRating: number
  revenueGrowth: number
  ordersGrowth: number
  viewsGrowth: number
  salesByDay: Array<{
    date: string
    sales: number
    orders: number
    views: number
  }>
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
    views: number
    rating: number
    conversionRate: number
  }>
}

export default function ExpertAnalyticsPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [expert, setExpert] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [transactions, setTransactions] = useState<MarketplaceTransaction[]>([])
  const [products, setProducts] = useState<MarketplaceProduct[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/dashboard/become-expert')
      return
    }

    loadExpertData()
  }, [user, router])

  useEffect(() => {
    if (expert) {
      loadAnalytics()
    }
  }, [expert, timeRange])

  const loadExpertData = async () => {
    if (!user) return

    try {
      const expertData = await MarketplaceModel.getExpertByUserId(user.uid)
      if (!expertData || expertData.status !== 'active') {
        router.push('/dashboard/expert')
        return
      }
      setExpert(expertData)
    } catch (error) {
      console.error('Failed to load expert data:', error)
      router.push('/dashboard/expert')
    }
  }

  const loadAnalytics = async () => {
    if (!expert) return

    try {
      setLoading(true)
      
      // Load transactions for the time period
      const allTransactions = await MarketplaceModel.getTransactionsBySeller(expert.id, 100)
      const days = parseInt(timeRange)
      const startDate = startOfDay(subDays(new Date(), days))
      
      // Filter transactions by date
      const filteredTransactions = allTransactions.filter(t => 
        t.createdAt >= startDate && t.status === 'completed'
      )
      setTransactions(filteredTransactions)

      // Load products
      const expertProducts = await MarketplaceModel.getProductsByExpert(expert.id)
      setProducts(expertProducts)

      // Calculate analytics
      const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.sellerEarnings, 0) / 100
      const totalOrders = filteredTransactions.length
      
      // Calculate previous period for growth comparison
      const prevStartDate = startOfDay(subDays(new Date(), days * 2))
      const prevEndDate = startDate
      const prevTransactions = allTransactions.filter(t => 
        t.createdAt >= prevStartDate && t.createdAt < prevEndDate && t.status === 'completed'
      )
      const prevRevenue = prevTransactions.reduce((sum, t) => sum + t.sellerEarnings, 0) / 100
      const prevOrders = prevTransactions.length

      // Calculate growth percentages
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0

      // Group sales by day
      const salesByDay: { [key: string]: { sales: number; orders: number } } = {}
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - i - 1), 'MMM dd')
        salesByDay[date] = { sales: 0, orders: 0 }
      }

      filteredTransactions.forEach(t => {
        const date = format(t.createdAt, 'MMM dd')
        if (salesByDay[date]) {
          salesByDay[date].sales += t.sellerEarnings / 100
          salesByDay[date].orders += 1
        }
      })

      // Calculate product analytics
      const productAnalytics = expertProducts.map(product => {
        const productTransactions = filteredTransactions.filter(t => t.productId === product.id)
        const productRevenue = productTransactions.reduce((sum, t) => sum + t.sellerEarnings, 0) / 100
        
        return {
          name: product.title,
          sales: productTransactions.length,
          revenue: productRevenue,
          views: 0, // Would need to implement view tracking
          rating: product.rating || 0,
          conversionRate: 0 // Would need view data to calculate
        }
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      // Calculate average rating
      const ratedProducts = expertProducts.filter(p => p.rating > 0)
      const averageRating = ratedProducts.length > 0 
        ? ratedProducts.reduce((sum, p) => sum + p.rating, 0) / ratedProducts.length 
        : 0

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalViews: 0, // Would need to implement view tracking
        averageRating,
        revenueGrowth,
        ordersGrowth,
        viewsGrowth: 0,
        salesByDay: Object.entries(salesByDay).map(([date, data]) => ({
          date,
          sales: data.sales,
          orders: data.orders,
          views: 0
        })),
        topProducts: productAnalytics
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!analyticsData) return

    const csvContent = [
      ['Date', 'Revenue', 'Orders'].join(','),
      ...analyticsData.salesByDay.map(day => 
        [day.date, day.sales, day.orders].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
            <div className={`flex items-center text-xs ${analyticsData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(analyticsData.revenueGrowth).toFixed(1)}% from previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
            <div className={`flex items-center text-xs ${analyticsData.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.ordersGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(analyticsData.ordersGrowth).toFixed(1)}% from previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalOrders > 0 
                ? formatCurrency(analyticsData.totalRevenue / analyticsData.totalOrders)
                : '$0'
              }
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1 fill-current" />
              From all products
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Daily revenue for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.salesByDay.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.salesByDay.map((day, index) => (
                    <div key={day.date} className="flex items-center">
                      <div className="w-20 text-sm">{day.date}</div>
                      <div className="flex-1 mx-4">
                        <Progress 
                          value={(day.sales / Math.max(...analyticsData.salesByDay.map(d => d.sales))) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div className="w-24 text-right text-sm font-medium">
                        {formatCurrency(day.sales)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No revenue data for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{product.sales} sales</span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {product.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No product sales for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Latest purchases from your products</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{transaction.productTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(transaction.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(transaction.sellerEarnings / 100)}</p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customers yet</p>
                  <p className="text-sm mt-2">Share your products to attract buyers</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {products.length === 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertCircle className="h-5 w-5" />
              No Products Listed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
              You haven't created any products yet. Start selling to see analytics data.
            </p>
            <Button onClick={() => router.push('/dashboard/expert/products/new')}>
              Create Your First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}