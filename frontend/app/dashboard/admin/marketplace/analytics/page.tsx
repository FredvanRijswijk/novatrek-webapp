'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { MarketplaceModel } from '@/lib/models/marketplace'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Activity,
  Percent,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

// Mock data for charts - in production, this would come from aggregated Firestore data
const generateMockRevenue = (days: number) => {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - i - 1), 'MMM dd'),
    revenue: Math.floor(Math.random() * 5000) + 1000,
    platformFees: Math.floor(Math.random() * 750) + 150,
    transactions: Math.floor(Math.random() * 20) + 5
  }))
}

const generateMockProducts = () => [
  { category: 'Safari Tours', count: 45, revenue: 125000 },
  { category: 'City Guides', count: 38, revenue: 45000 },
  { category: 'Adventure Trips', count: 32, revenue: 98000 },
  { category: 'Cultural Tours', count: 28, revenue: 67000 },
  { category: 'Food & Wine', count: 22, revenue: 34000 }
]

const generateMockExperts = () => [
  { name: 'African Safari Co.', sales: 125000, products: 12, rating: 4.8 },
  { name: 'Tokyo Adventures', sales: 98000, products: 8, rating: 4.9 },
  { name: 'Paris Guides', sales: 87000, products: 15, rating: 4.7 },
  { name: 'NYC Tours', sales: 76000, products: 10, rating: 4.6 },
  { name: 'London Walks', sales: 65000, products: 20, rating: 4.8 }
]

export default function MarketplaceAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    platformFees: 0,
    activeExperts: 0,
    totalProducts: 0,
    totalTransactions: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    avgRating: 0
  })

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setLoading(true)
      
      // In production, fetch real data from Firestore
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const revenue = generateMockRevenue(days)
      setRevenueData(revenue)
      
      // Calculate metrics
      const totalRevenue = revenue.reduce((sum, day) => sum + day.revenue, 0)
      const totalFees = revenue.reduce((sum, day) => sum + day.platformFees, 0)
      const totalTrans = revenue.reduce((sum, day) => sum + day.transactions, 0)
      
      setMetrics({
        totalRevenue,
        platformFees: totalFees,
        activeExperts: 42,
        totalProducts: 165,
        totalTransactions: totalTrans,
        avgOrderValue: totalRevenue / totalTrans,
        conversionRate: 3.2,
        avgRating: 4.7
      })
      
      setLoading(false)
    }
    
    loadData()
  }, [timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: { 
    title: string
    value: number
    change?: number
    icon: any
    format?: 'currency' | 'number' | 'percent'
  }) => {
    const formattedValue = format === 'currency' 
      ? formatCurrency(value)
      : format === 'percent'
      ? `${value}%`
      : value.toLocaleString()
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {change !== undefined && (
            <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}% from last period
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const productCategories = generateMockProducts()
  const topExperts = generateMockExperts()

  return (
    <AdminRoute requiredPermission={{ resource: 'marketplace', action: 'read' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Marketplace Analytics</h1>
            <p className="text-muted-foreground">
              Track performance, revenue, and growth metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={metrics.totalRevenue}
            change={12.5}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title="Platform Fees"
            value={metrics.platformFees}
            change={15.2}
            icon={Percent}
            format="currency"
          />
          <MetricCard
            title="Active Experts"
            value={metrics.activeExperts}
            change={8.3}
            icon={Users}
          />
          <MetricCard
            title="Total Products"
            value={metrics.totalProducts}
            change={5.7}
            icon={Package}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Transactions"
            value={metrics.totalTransactions}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Avg Order Value"
            value={metrics.avgOrderValue}
            icon={Activity}
            format="currency"
          />
          <MetricCard
            title="Conversion Rate"
            value={metrics.conversionRate}
            icon={TrendingUp}
            format="percent"
          />
          <MetricCard
            title="Avg Rating"
            value={metrics.avgRating}
            icon={Star}
          />
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="experts">Experts</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Daily revenue and platform fees for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Simple bar chart visualization */}
                  <div className="space-y-2">
                    {revenueData.slice(-7).map((day, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-muted-foreground">{day.date}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(day.revenue / 5000) * 100} 
                              className="h-2"
                            />
                            <span className="text-sm font-medium w-20 text-right">
                              {formatCurrency(day.revenue)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(day.platformFees / 750) * 100} 
                              className="h-2 [&>div]:bg-orange-500"
                            />
                            <span className="text-sm text-muted-foreground w-20 text-right">
                              {formatCurrency(day.platformFees)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded" />
                      <span className="text-sm">Total Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded" />
                      <span className="text-sm">Platform Fees (15%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>
                  Best performing product categories by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.count} products
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(category.revenue)}</p>
                        <Progress 
                          value={(category.revenue / 125000) * 100} 
                          className="w-32 h-2 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Experts</CardTitle>
                <CardDescription>
                  Experts ranked by total sales volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topExperts.map((expert, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{expert.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{expert.products} products</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span>{expert.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(expert.sales)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(expert.sales * 0.15)} platform fees
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>
                    User journey from browse to purchase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Page Views</span>
                        <span className="font-medium">12,458</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Product Views</span>
                        <span className="font-medium">8,234</span>
                      </div>
                      <Progress value={66} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Add to Cart</span>
                        <span className="font-medium">2,156</span>
                      </div>
                      <Progress value={17} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Purchases</span>
                        <span className="font-medium">398</span>
                      </div>
                      <Progress value={3.2} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                  <CardDescription>
                    Key performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Avg Response Time</span>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        2.3 hours
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Dispute Rate</span>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        0.8%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Expert Retention</span>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        94%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Customer Satisfaction</span>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        4.7/5
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  )
}