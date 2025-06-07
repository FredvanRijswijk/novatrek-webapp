'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  AlertCircle,
  Users,
  DollarSign,
  Star,
  Package,
  Calendar,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'


interface Expert {
  id: string
  userId: string
  stripeConnectAccountId: string
  businessName: string
  bio: string
  specializations: string[]
  rating: number
  reviewCount: number
  status: 'pending' | 'active' | 'suspended'
  onboardingComplete: boolean
  payoutSchedule: 'daily' | 'weekly' | 'monthly'
  profileImageUrl?: string
  contactEmail?: string
  websiteUrl?: string
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
  }
  createdAt: any
  updatedAt: any
  productCount?: number
  totalSales?: number
  totalRevenue?: number
}

export default function AdminExpertsPage() {
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [experts, setExperts] = useState<Expert[]>([])
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'newest'
  })
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    if (user) {
      loadExperts()
    }
  }, [user, filters.status, filters.sortBy])

  const loadExperts = async () => {
    try {
      let q = query(collection(db, 'marketplace_experts'))

      // Apply filters
      if (filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status))
      }

      // Apply sorting
      if (filters.sortBy === 'newest') {
        q = query(q, orderBy('createdAt', 'desc'))
      } else if (filters.sortBy === 'rating') {
        q = query(q, orderBy('rating', 'desc'))
      } else if (filters.sortBy === 'revenue') {
        // Would need to aggregate from transactions
        q = query(q, orderBy('createdAt', 'desc'))
      }

      const querySnapshot = await getDocs(q)
      const expertsData: Expert[] = []

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data()
        const expert: Expert = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Expert

        // Get product count
        try {
          const productsQuery = query(
            collection(db, 'marketplace_products'),
            where('expertId', '==', expert.id)
          )
          const productsSnapshot = await getDocs(productsQuery)
          expert.productCount = productsSnapshot.size

          // Calculate total sales and revenue from products
          let totalSales = 0
          let totalRevenue = 0
          productsSnapshot.forEach(doc => {
            const product = doc.data()
            totalSales += product.salesCount || 0
            totalRevenue += (product.salesCount || 0) * (product.price || 0)
          })
          expert.totalSales = totalSales
          expert.totalRevenue = totalRevenue
        } catch (error) {
          console.error('Error loading expert stats:', error)
        }

        expertsData.push(expert)
      }

      // Apply search filter
      const filtered = expertsData.filter(expert => {
        if (!filters.search) return true
        const searchLower = filters.search.toLowerCase()
        return expert.businessName.toLowerCase().includes(searchLower) ||
               expert.contactEmail?.toLowerCase().includes(searchLower) ||
               expert.specializations.some(s => s.toLowerCase().includes(searchLower))
      })

      setExperts(filtered)
    } catch (error) {
      console.error('Error loading experts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (expertId: string, newStatus: string) => {
    setActionLoading(true)
    try {
      await updateDoc(doc(db, 'marketplace_experts', expertId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      // If suspending, also deactivate all their products
      if (newStatus === 'suspended') {
        const productsQuery = query(
          collection(db, 'marketplace_products'),
          where('expertId', '==', expertId)
        )
        const productsSnapshot = await getDocs(productsQuery)
        const updatePromises = productsSnapshot.docs.map(doc =>
          updateDoc(doc.ref, { status: 'inactive', updatedAt: new Date() })
        )
        await Promise.all(updatePromises)
      }

      await loadExperts()
      setShowDetailDialog(false)
      setSelectedExpert(null)
    } catch (error) {
      console.error('Error updating expert:', error)
    } finally {
      setActionLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const statusCounts = {
    all: experts.length,
    active: experts.filter(e => e.status === 'active').length,
    pending: experts.filter(e => e.status === 'pending').length,
    suspended: experts.filter(e => e.status === 'suspended').length
  }

  return (
    <AdminRoute>
      <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Expert Management</h1>
        <p className="text-muted-foreground">
          Manage travel experts and their accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Experts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.suspended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search experts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="revenue">Top Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Experts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expert</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experts.map((expert) => (
                <TableRow key={expert.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{expert.businessName}</p>
                      <p className="text-sm text-muted-foreground">{expert.contactEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      expert.status === 'active' ? 'default' :
                      expert.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {expert.status}
                    </Badge>
                    {!expert.onboardingComplete && expert.status === 'active' && (
                      <Badge variant="outline" className="ml-1">
                        Onboarding
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{expert.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({expert.reviewCount})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{expert.productCount || 0}</TableCell>
                  <TableCell>{expert.totalSales || 0}</TableCell>
                  <TableCell>{formatCurrency(expert.totalRevenue || 0)}</TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {format(expert.createdAt, 'MMM d, yyyy')}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedExpert(expert)
                          setShowDetailDialog(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {expert.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(expert.id, 'active')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {expert.status === 'active' && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedExpert(expert)
                            setShowDetailDialog(true)
                            setSuspendReason('')
                          }}>
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {experts.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No experts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expert Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expert Details</DialogTitle>
            <DialogDescription>
              View and manage expert information
            </DialogDescription>
          </DialogHeader>

          {selectedExpert && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedExpert.businessName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedExpert.contactEmail}</p>
                  </div>
                  <Badge variant={
                    selectedExpert.status === 'active' ? 'default' :
                    selectedExpert.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {selectedExpert.status}
                  </Badge>
                </div>

                {selectedExpert.bio && (
                  <div>
                    <Label>Bio</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedExpert.bio}</p>
                  </div>
                )}

                <div>
                  <Label>Specializations</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedExpert.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-2">
                  {selectedExpert.websiteUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={selectedExpert.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedExpert.websiteUrl}
                      </a>
                    </div>
                  )}
                  {selectedExpert.socialLinks?.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      <a 
                        href={`https://instagram.com/${selectedExpert.socialLinks.instagram}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        @{selectedExpert.socialLinks.instagram}
                      </a>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Products</span>
                        <span className="font-medium">{selectedExpert.productCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Sales</span>
                        <span className="font-medium">{selectedExpert.totalSales || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-medium">{formatCurrency(selectedExpert.totalRevenue || 0)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Account Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payout Schedule</span>
                        <span className="font-medium capitalize">{selectedExpert.payoutSchedule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Stripe Connected</span>
                        <span className="font-medium">{selectedExpert.onboardingComplete ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Member Since</span>
                        <span className="font-medium">{format(selectedExpert.createdAt, 'MMM yyyy')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Suspend Reason */}
              {selectedExpert.status === 'active' && (
                <div className="space-y-2">
                  <Label htmlFor="suspend-reason">Reason for Suspension (Required to suspend)</Label>
                  <Textarea
                    id="suspend-reason"
                    placeholder="Provide a reason for suspending this expert..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
                {selectedExpert.stripeConnectAccountId && (
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://dashboard.stripe.com/connect/accounts/${selectedExpert.stripeConnectAccountId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View in Stripe
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {selectedExpert.status === 'active' && suspendReason && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleStatusUpdate(selectedExpert.id, 'suspended')}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Suspend Expert
                  </Button>
                )}
                {selectedExpert.status !== 'active' && (
                  <Button 
                    onClick={() => handleStatusUpdate(selectedExpert.id, 'active')}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Activate Expert
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminRoute>
  )
}