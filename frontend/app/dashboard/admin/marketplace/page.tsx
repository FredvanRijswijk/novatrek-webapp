'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building,
  Calendar,
  Eye,
  Ban,
  Settings,
  FileText,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'


interface DashboardStats {
  totalExperts: number
  activeExperts: number
  totalProducts: number
  activeProducts: number
  totalTransactions: number
  totalRevenue: number
  platformFees: number
  pendingApplications: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  subscribedUsers: number
}

export default function MarketplaceAdminDashboard() {
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalExperts: 0,
    activeExperts: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    platformFees: 0,
    pendingApplications: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0,
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    subscribedUsers: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [topExperts, setTopExperts] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Fetch user stats from API
      let userStats = { total: 0, active: 0, verified: 0, subscribed: 0 }
      if (user) {
        try {
          const token = await user.getIdToken()
          const response = await fetch('/api/admin/users?limit=1', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            userStats = data.stats
          }
        } catch (error) {
          console.error('Error fetching user stats:', error)
        }
      }

      // Load stats
      const [
        expertsSnapshot,
        activeExpertsSnapshot,
        productsSnapshot,
        activeProductsSnapshot,
        transactionsSnapshot,
        pendingAppsSnapshot
      ] = await Promise.all([
        getCountFromServer(collection(db, 'marketplace_experts')),
        getCountFromServer(query(collection(db, 'marketplace_experts'), where('status', '==', 'active'))),
        getCountFromServer(collection(db, 'marketplace_products')),
        getCountFromServer(query(collection(db, 'marketplace_products'), where('status', '==', 'active'))),
        getDocs(query(collection(db, 'marketplace_transactions'), where('status', '==', 'completed'))),
        getCountFromServer(query(collection(db, 'marketplace_applications'), where('status', '==', 'pending')))
      ])

      // Calculate revenue stats
      let totalRevenue = 0
      let platformFees = 0
      let thisMonthRevenue = 0
      let lastMonthRevenue = 0
      
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data()
        totalRevenue += transaction.amount || 0
        platformFees += transaction.platformFee || 0
        
        const createdAt = transaction.createdAt?.toDate()
        if (createdAt >= thisMonth) {
          thisMonthRevenue += transaction.amount || 0
        } else if (createdAt >= lastMonth && createdAt <= lastMonthEnd) {
          lastMonthRevenue += transaction.amount || 0
        }
      })

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      setStats({
        totalExperts: expertsSnapshot.data().count,
        activeExperts: activeExpertsSnapshot.data().count,
        totalProducts: productsSnapshot.data().count,
        activeProducts: activeProductsSnapshot.data().count,
        totalTransactions: transactionsSnapshot.size,
        totalRevenue,
        platformFees,
        pendingApplications: pendingAppsSnapshot.data().count,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        verifiedUsers: userStats.verified,
        subscribedUsers: userStats.subscribed
      })

      // Load recent transactions
      const transactionsQuery = query(
        collection(db, 'marketplace_transactions'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const transactionsData = await getDocs(transactionsQuery)
      setRecentTransactions(
        transactionsData.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      )

      // Load top experts by revenue
      const expertsQuery = query(
        collection(db, 'marketplace_experts'),
        where('status', '==', 'active'),
        orderBy('rating', 'desc'),
        limit(5)
      )
      const expertsData = await getDocs(expertsQuery)
      setTopExperts(
        expertsData.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      )

      // Load recent products
      const productsQuery = query(
        collection(db, 'marketplace_products'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const productsData = await getDocs(productsQuery)
      setRecentProducts(
        productsData.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      )

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <AdminRoute>
      <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Marketplace Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage experts, products, and monitor marketplace performance
        </p>
      </div>


      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.revenueGrowth > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">{formatPercentage(stats.revenueGrowth)}</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-red-600">{formatPercentage(Math.abs(stats.revenueGrowth))}</span>
                </>
              )}
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.platformFees)}</div>
            <p className="text-xs text-muted-foreground">
              15% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Experts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeExperts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalExperts} total experts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts} total products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verifiedUsers} verified ({stats.subscribedUsers} subscribed)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-7">
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/marketplace/analytics">
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/marketplace/applications">
            <FileText className="mr-2 h-4 w-4" />
            Applications ({stats.pendingApplications})
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/marketplace/experts">
            <Users className="mr-2 h-4 w-4" />
            Manage Experts
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/marketplace/products">
            <Package className="mr-2 h-4 w-4" />
            Moderate Products
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/recommendations">
            <Sparkles className="mr-2 h-4 w-4" />
            Recommendations
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/marketplace/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </Link>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="experts">Top Experts</TabsTrigger>
          <TabsTrigger value="products">Recent Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded">
                  <p className="text-muted-foreground">Revenue chart would go here</p>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trip Templates</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consultations</span>
                    <span className="text-sm font-medium">22%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '22%' }} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Custom Planning</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '10%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest marketplace transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Expert</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.productTitle || 'Unknown'}
                      </TableCell>
                      <TableCell>{transaction.buyerId?.slice(0, 8)}...</TableCell>
                      <TableCell>{transaction.sellerId?.slice(0, 8)}...</TableCell>
                      <TableCell>{formatCurrency(transaction.amount || 0)}</TableCell>
                      <TableCell>{formatCurrency(transaction.platformFee || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          transaction.status === 'refunded' ? 'destructive' : 'outline'
                        }>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Experts</CardTitle>
              <CardDescription>Experts with highest ratings and sales</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expert</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topExperts.map((expert) => (
                    <TableRow key={expert.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{expert.businessName}</p>
                          <p className="text-sm text-muted-foreground">{expert.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expert.status === 'active' ? 'default' : 'secondary'}>
                          {expert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{expert.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </TableCell>
                      <TableCell>{expert.reviewCount || 0}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>Newly added products requiring review</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expert</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.expertId?.slice(0, 8)}...</TableCell>
                      <TableCell>{formatCurrency(product.price || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Review
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminRoute>
  )
}