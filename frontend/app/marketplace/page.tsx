'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { PublicLayout } from '@/components/layout/PublicLayout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Search,
  Filter,
  Heart,
  ChevronRight,
  Clock,
  DollarSign,
  Sparkles,
  Mountain,
  Building,
  Palmtree,
  Plane,
  Car,
  Utensils,
  Camera,
  TreePine,
  Waves,
  Globe,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { MarketplaceProduct, TravelExpert } from '@/lib/models/marketplace'
import Image from 'next/image'
import Link from 'next/link'
import { track } from '@vercel/analytics'

const DESTINATION_ICONS: Record<string, any> = {
  'city': Building,
  'beach': Palmtree,
  'mountain': Mountain,
  'adventure': TreePine,
  'cultural': Globe,
  'island': Waves,
}

const PRODUCT_TYPE_LABELS = {
  'trip_template': 'Trip Template',
  'consultation': 'Consultation',
  'custom_planning': 'Custom Planning'
}

export default function MarketplacePage() {
  const router = useRouter()
  const [products, setProducts] = useState<(MarketplaceProduct & { expert?: TravelExpert })[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    priceRange: [0, 5000],
    destinations: [] as string[],
    duration: 'all',
    sortBy: 'popular'
  })
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    loadProducts()
  }, [filters.type, filters.sortBy])

  const loadProducts = async () => {
    try {
      // Build query
      let q = query(
        collection(db, 'marketplace_products'),
        where('status', '==', 'active')
      )

      if (filters.type !== 'all') {
        q = query(q, where('type', '==', filters.type))
      }

      // Add sorting
      if (filters.sortBy === 'popular') {
        q = query(q, orderBy('salesCount', 'desc'), orderBy('rating', 'desc'))
      } else if (filters.sortBy === 'price_low') {
        q = query(q, orderBy('price', 'asc'))
      } else if (filters.sortBy === 'price_high') {
        q = query(q, orderBy('price', 'desc'))
      } else if (filters.sortBy === 'newest') {
        q = query(q, orderBy('createdAt', 'desc'))
      }

      q = query(q, limit(20))

      const querySnapshot = await getDocs(q)
      const productsData: (MarketplaceProduct & { expert?: TravelExpert })[] = []

      // Load products with expert info
      for (const doc of querySnapshot.docs) {
        const product = {
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as MarketplaceProduct

        // Load expert info
        try {
          const expertDoc = await getDocs(
            query(collection(db, 'marketplace_experts'), where('id', '==', product.expertId), limit(1))
          )
          if (!expertDoc.empty) {
            product.expert = expertDoc.docs[0].data() as TravelExpert
          }
        } catch (error) {
          console.error('Error loading expert:', error)
        }

        productsData.push(product)
      }

      setProducts(productsData)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    // Search filter
    if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    // Price filter
    const priceInDollars = product.price / 100
    if (priceInDollars < filters.priceRange[0] || priceInDollars > filters.priceRange[1]) {
      return false
    }

    // Duration filter
    if (filters.duration !== 'all' && product.type === 'trip_template') {
      const days = product.tripLength || 0
      if (filters.duration === 'short' && days > 3) return false
      if (filters.duration === 'medium' && (days < 4 || days > 7)) return false
      if (filters.duration === 'long' && days < 8) return false
    }

    return true
  })

  const toggleFavorite = (productId: string) => {
    const isAdding = !favorites.includes(productId)
    track('click', { 
      button: 'favorite_product', 
      page: 'marketplace',
      action: isAdding ? 'add' : 'remove',
      productId 
    })
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Your Next Adventure
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Browse curated trip templates and connect with expert travel planners
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search destinations, activities, or travel styles..."
                className="pl-12 pr-4 py-6 text-lg"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="trip_template">Trip Templates</SelectItem>
                      <SelectItem value="consultation">Consultations</SelectItem>
                      <SelectItem value="custom_planning">Custom Planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                      max={5000}
                      step={50}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}+</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Trip Duration</Label>
                  <Select value={filters.duration} onValueChange={(value) => setFilters(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Duration</SelectItem>
                      <SelectItem value="short">1-3 days</SelectItem>
                      <SelectItem value="medium">4-7 days</SelectItem>
                      <SelectItem value="long">8+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Popular Destinations */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Popular Destinations</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'].map((region) => (
                    <Button
                      key={region}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {region}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No products found matching your criteria</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    {/* Product Image */}
                    <div className="relative aspect-[4/3] bg-muted">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                          <Sparkles className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      
                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(product.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>

                      {/* Product Type Badge */}
                      <Badge className="absolute top-2 left-2">
                        {PRODUCT_TYPE_LABELS[product.type]}
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>

                      {/* Expert Info */}
                      {product.expert && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            {product.expert.businessName.charAt(0)}
                          </div>
                          <span>{product.expert.businessName}</span>
                        </div>
                      )}

                      {/* Destinations or Duration */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                        {product.type === 'trip_template' && product.destinations ? (
                          <>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {product.destinations.slice(0, 2).join(', ')}
                              {product.destinations.length > 2 && ` +${product.destinations.length - 2}`}
                            </span>
                            {product.tripLength && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {product.tripLength} days
                              </span>
                            )}
                          </>
                        ) : product.type === 'consultation' && product.duration ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {product.duration}
                          </span>
                        ) : null}
                      </div>

                      {/* Rating */}
                      {product.reviewCount > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{product.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
                          {product.type === 'trip_template' && (
                            <span className="text-muted-foreground text-sm">per person</span>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      <Button 
                        asChild 
                        className="w-full group"
                        onClick={() => {
                          track('click', { 
                            button: 'view_product_details', 
                            page: 'marketplace',
                            productId: product.id,
                            productType: product.type,
                            productPrice: product.price
                          })
                        }}
                      >
                        <Link href={`/marketplace/products/${product.id}`}>
                          View Details
                          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}