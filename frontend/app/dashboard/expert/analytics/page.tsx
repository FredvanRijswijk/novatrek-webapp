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
  BarChart3
} from 'lucide-react'
import { format, subDays } from 'date-fns'

// Mock data - in production, this would be fetched from Firestore
const generateMockSales = (days: number) => {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - i - 1), 'MMM dd'),
    sales: Math.floor(Math.random() * 3000) + 500,
    orders: Math.floor(Math.random() * 10) + 1,
    views: Math.floor(Math.random() * 200) + 50
  }))
}

const generateMockProducts = () => [
  { 
    name: 'African Safari Adventure - 7 Days',
    sales: 15,
    revenue: 45000,
    views: 450,
    rating: 4.8,
    conversionRate: 3.3
  },
  { 
    name: 'Luxury Safari & Beach Combo',
    sales: 8,
    revenue: 32000,
    views: 280,
    rating: 4.9,
    conversionRate: 2.9
  },
  { 
    name: 'Budget Safari Experience',
    sales: 22,
    revenue: 22000,
    views: 680,
    rating: 4.7,
    conversionRate: 3.2
  },
  { 
    name: 'Photography Safari Special',
    sales: 5,
    revenue: 20000,
    views: 120,
    rating: 5.0,
    conversionRate: 4.2
  }
]

export default function ExpertAnalyticsPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    netEarnings: 0,
    totalOrders: 0,
    totalViews: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    avgRating: 4.8,
    repeatCustomerRate: 32
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const sales = generateMockSales(days)
      setSalesData(sales)
      
      const totalRevenue = sales.reduce((sum, day) => sum + day.sales, 0)
      const totalOrders = sales.reduce((sum, day) => sum + day.orders, 0)
      const totalViews = sales.reduce((sum, day) => sum + day.views, 0)
      
      setMetrics({
        totalRevenue,
        netEarnings: totalRevenue * 0.85, // After 15% platform fee
        totalOrders,
        totalViews,
        avgOrderValue: totalRevenue / totalOrders,
        conversionRate: (totalOrders / totalViews) * 100,
        avgRating: 4.8,
        repeatCustomerRate: 32
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
    subtitle,
    change, 
    icon: Icon, 
    format = 'number' 
  }: { 
    title: string
    value: number
    subtitle?: string
    change?: number
    icon: any
    format?: 'currency' | 'number' | 'percent'
  }) => {
    const formattedValue = format === 'currency' 
      ? formatCurrency(value)
      : format === 'percent'
      ? `${value.toFixed(1)}%`
      : value.toLocaleString()
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className={`flex items-center text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}% from last period
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const products = generateMockProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sales performance and customer insights
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
          change={15.2}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Net Earnings"
          value={metrics.netEarnings}
          subtitle="After 15% platform fee"
          change={15.2}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          change={8.7}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Product Views"
          value={metrics.totalViews}
          change={12.3}
          icon={Eye}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Order Value"
          value={metrics.avgOrderValue}
          icon={BarChart3}
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
        <MetricCard
          title="Repeat Customers"
          value={metrics.repeatCustomerRate}
          icon={Users}
          format="percent"
        />
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>
                Daily sales and order volume for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sales chart */}
                <div className="space-y-2">
                  {salesData.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-muted-foreground">{day.date}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(day.sales / 3000) * 100} 
                            className="h-2"
                          />
                          <span className="text-sm font-medium w-24 text-right">
                            {formatCurrency(day.sales)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.orders} orders • {day.views} views
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>
                  Understanding your earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gross Revenue</span>
                    <span className="font-medium">{formatCurrency(metrics.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">Platform Fee (15%)</span>
                    <span className="font-medium">-{formatCurrency(metrics.totalRevenue * 0.15)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-medium">Net Earnings</span>
                    <span className="font-bold text-lg">{formatCurrency(metrics.netEarnings)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key indicators of success
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Rate</span>
                      <Badge variant="outline" className="text-green-600">98%</Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>On-time Delivery</span>
                      <Badge variant="outline" className="text-green-600">95%</Badge>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Customer Satisfaction</span>
                      <Badge variant="outline" className="text-green-600">4.8/5</Badge>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Your top performing products by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{product.sales} sales</span>
                          <span>{product.views} views</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{product.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.conversionRate}% conversion
                        </p>
                      </div>
                    </div>
                    <Progress value={(product.revenue / 45000) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Demographics</CardTitle>
                <CardDescription>
                  Where your customers come from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>United States</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>United Kingdom</span>
                      <span className="font-medium">22%</span>
                    </div>
                    <Progress value={22} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Canada</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Australia</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Other</span>
                      <span className="font-medium">8%</span>
                    </div>
                    <Progress value={8} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Behavior</CardTitle>
                <CardDescription>
                  How customers interact with your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avg Time to Purchase</span>
                    </div>
                    <Badge variant="outline">2.5 days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avg Views Before Purchase</span>
                    </div>
                    <Badge variant="outline">3.2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Repeat Purchase Rate</span>
                    </div>
                    <Badge variant="outline">32%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Peak Booking Day</span>
                    </div>
                    <Badge variant="outline">Saturday</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                What customers are saying about your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                      <span className="font-medium">John D.</span>
                    </div>
                    <span className="text-sm text-muted-foreground">2 days ago</span>
                  </div>
                  <p className="text-sm">
                    "Amazing safari experience! The guide was knowledgeable and the accommodations exceeded expectations."
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ))}
                        <Star className="h-4 w-4 text-gray-300" />
                      </div>
                      <span className="font-medium">Sarah M.</span>
                    </div>
                    <span className="text-sm text-muted-foreground">5 days ago</span>
                  </div>
                  <p className="text-sm">
                    "Great trip overall. Would have liked more time at each location but otherwise perfect!"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}