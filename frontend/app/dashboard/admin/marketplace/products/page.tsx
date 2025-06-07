'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  ShoppingCart
} from 'lucide-react'


interface Product {
  id: string
  expertId: string
  expertName?: string
  type: 'trip_template' | 'consultation' | 'custom_planning'
  title: string
  description: string
  price: number
  currency: string
  status: 'draft' | 'active' | 'inactive' | 'suspended'
  destinations?: string[]
  tripLength?: number
  duration?: string
  included: string[]
  salesCount: number
  rating: number
  reviewCount: number
  createdAt: any
  updatedAt: any
  flagged?: boolean
  flagReason?: string
}

export default function AdminProductsPage() {
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'newest'
  })
  const [flagReason, setFlagReason] = useState('')

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user, filters.status, filters.type, filters.sortBy])

  const loadProducts = async () => {
    try {
      let q = query(collection(db, 'marketplace_products'))

      // Apply filters
      if (filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status))
      }
      if (filters.type !== 'all') {
        q = query(q, where('type', '==', filters.type))
      }

      // Apply sorting
      if (filters.sortBy === 'newest') {
        q = query(q, orderBy('createdAt', 'desc'))
      } else if (filters.sortBy === 'popular') {
        q = query(q, orderBy('salesCount', 'desc'))
      } else if (filters.sortBy === 'price_high') {
        q = query(q, orderBy('price', 'desc'))
      }

      const querySnapshot = await getDocs(q)
      const productsData: Product[] = []

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data()
        const product: Product = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Product

        // Get expert name
        if (product.expertId) {
          try {
            const expertQuery = query(
              collection(db, 'marketplace_experts'),
              where('id', '==', product.expertId),
              where('__name__', '==', product.expertId)
            )
            const expertSnapshot = await getDocs(expertQuery)
            if (!expertSnapshot.empty) {
              product.expertName = expertSnapshot.docs[0].data().businessName
            }
          } catch (error) {
            console.error('Error loading expert:', error)
          }
        }

        productsData.push(product)
      }

      // Apply search filter
      const filtered = productsData.filter(product => {
        if (!filters.search) return true
        const searchLower = filters.search.toLowerCase()
        return product.title.toLowerCase().includes(searchLower) ||
               product.description.toLowerCase().includes(searchLower) ||
               (product.expertName && product.expertName.toLowerCase().includes(searchLower))
      })

      setProducts(filtered)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (productId: string, newStatus: string) => {
    setActionLoading(true)
    try {
      await updateDoc(doc(db, 'marketplace_products', productId), {
        status: newStatus,
        updatedAt: new Date()
      })
      await loadProducts()
      setShowReviewDialog(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Error updating product:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleFlag = async () => {
    if (!selectedProduct || !flagReason.trim()) return

    setActionLoading(true)
    try {
      await updateDoc(doc(db, 'marketplace_products', selectedProduct.id), {
        flagged: true,
        flagReason: flagReason,
        status: 'suspended',
        updatedAt: new Date()
      })
      await loadProducts()
      setShowReviewDialog(false)
      setSelectedProduct(null)
      setFlagReason('')
    } catch (error) {
      console.error('Error flagging product:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return

    setActionLoading(true)
    try {
      await deleteDoc(doc(db, 'marketplace_products', productId))
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
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
    all: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    draft: products.filter(p => p.status === 'draft').length,
    suspended: products.filter(p => p.status === 'suspended').length,
    flagged: products.filter(p => p.flagged).length
  }

  return (
    <AdminRoute>
      <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Product Management</h1>
        <p className="text-muted-foreground">
          Review and moderate marketplace products
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
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
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.inactive}</div>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.flagged}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="trip_template">Trip Templates</SelectItem>
                <SelectItem value="consultation">Consultations</SelectItem>
                <SelectItem value="custom_planning">Custom Planning</SelectItem>
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
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price_high">Highest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expert</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="font-medium line-clamp-1">{product.title}</p>
                      {product.flagged && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-600">Flagged: {product.flagReason}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{product.expertName || 'Unknown'}</p>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {product.salesCount} sales
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {product.rating.toFixed(1)} ({product.reviewCount})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      product.status === 'active' ? 'default' :
                      product.status === 'suspended' ? 'destructive' :
                      product.status === 'inactive' ? 'secondary' : 'outline'
                    }>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {product.createdAt.toLocaleDateString()}
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
                          setSelectedProduct(product)
                          setShowReviewDialog(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(product.id, 'active')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {product.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(product.id, 'inactive')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleStatusUpdate(product.id, 'suspended')}>
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Product</DialogTitle>
            <DialogDescription>
              Review product details and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <p className="font-medium">{selectedProduct.title}</p>
                </div>

                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <p>{selectedProduct.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <p>{formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>

                {selectedProduct.type === 'trip_template' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Destinations</Label>
                      <p>{selectedProduct.destinations?.join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <p>{selectedProduct.tripLength} days</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label>What's Included</Label>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedProduct.included.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label>Current Status</Label>
                  <Badge className="mt-1" variant={
                    selectedProduct.status === 'active' ? 'default' :
                    selectedProduct.status === 'suspended' ? 'destructive' : 'secondary'
                  }>
                    {selectedProduct.status}
                  </Badge>
                </div>
              </div>

              {/* Flag Product */}
              <div className="space-y-2">
                <Label htmlFor="flag-reason">Flag Product (Optional)</Label>
                <Textarea
                  id="flag-reason"
                  placeholder="Reason for flagging this product..."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Cancel
                </Button>
                {flagReason && (
                  <Button 
                    variant="destructive" 
                    onClick={handleFlag}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Flag & Suspend
                  </Button>
                )}
                {selectedProduct.status !== 'active' && (
                  <Button 
                    onClick={() => handleStatusUpdate(selectedProduct.id, 'active')}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve & Activate
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