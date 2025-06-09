'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, X, Upload } from 'lucide-react'
import { useEffect } from 'react'

const PRODUCT_TYPES = {
  trip_template: {
    label: 'Trip Template',
    description: 'Pre-planned itinerary that customers can purchase and customize'
  },
  consultation: {
    label: 'Consultation Service',
    description: 'One-on-one travel planning consultation'
  },
  custom_planning: {
    label: 'Custom Trip Planning',
    description: 'Fully customized trip planning service'
  }
}

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(false)
  const [expert, setExpert] = useState<any>(null)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    type: 'trip_template' as keyof typeof PRODUCT_TYPES,
    title: '',
    description: '',
    price: '',
    currency: 'usd',
    duration: '',
    tripLength: '',
    destinations: [] as string[],
    currentDestination: '',
    included: [] as string[],
    currentIncluded: '',
    highlights: [] as string[],
    currentHighlight: '',
    tags: [] as string[],
    currentTag: '',
    maxGroupSize: '',
    difficulty: 'moderate' as 'easy' | 'moderate' | 'challenging',
    bestTimeToVisit: [] as string[],
    images: [] as string[] // For now, just URLs
  })

  useEffect(() => {
    async function loadExpert() {
      if (!user) return

      try {
        const expertData = await MarketplaceModel.getExpertByUserId(user.uid)
        if (!expertData || !expertData.onboardingComplete) {
          router.push('/dashboard/expert')
          return
        }
        setExpert(expertData)
      } catch (error) {
        console.error('Error loading expert:', error)
        router.push('/dashboard/expert')
      }
    }

    loadExpert()
  }, [user, router])

  const handleAddItem = (field: 'destinations' | 'included' | 'highlights' | 'tags') => {
    const currentField = `current${field.charAt(0).toUpperCase() + field.slice(1).replace(/s$/, '')}` as keyof typeof formData
    const value = formData[currentField] as string
    
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
        [currentField]: ''
      }))
    }
  }

  const handleRemoveItem = (field: 'destinations' | 'included' | 'highlights' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a product title')
      return false
    }

    if (!formData.description.trim()) {
      setError('Please enter a product description')
      return false
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price')
      return false
    }

    if (formData.type === 'trip_template') {
      if (formData.destinations.length === 0) {
        setError('Please add at least one destination')
        return false
      }
      if (!formData.tripLength) {
        setError('Please specify the trip length')
        return false
      }
    }

    if (formData.type === 'consultation' && !formData.duration) {
      setError('Please specify the consultation duration')
      return false
    }

    if (formData.included.length === 0) {
      setError('Please add at least one included item')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!expert || !validateForm()) return

    setLoading(true)
    setError('')

    try {
      const productData = {
        expertId: expert.id,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        currency: formData.currency,
        duration: formData.duration || undefined,
        tripLength: formData.tripLength ? parseInt(formData.tripLength) : undefined,
        destinations: formData.destinations.length > 0 ? formData.destinations : undefined,
        included: formData.included,
        highlights: formData.highlights.length > 0 ? formData.highlights : undefined,
        images: [], // Would handle image uploads here
        status: 'active' as const,
        salesCount: 0,
        rating: 0,
        reviewCount: 0,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        maxGroupSize: formData.maxGroupSize ? parseInt(formData.maxGroupSize) : undefined,
        difficulty: formData.type === 'trip_template' ? formData.difficulty : undefined,
        bestTimeToVisit: formData.bestTimeToVisit.length > 0 ? formData.bestTimeToVisit : undefined
      }

      await MarketplaceModel.createProduct(productData)
      router.push('/dashboard/expert')

    } catch (err) {
      console.error('Product creation error:', err)
      setError('Failed to create product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!expert) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
            <CardDescription>
              Add a new trip template or service to your marketplace offerings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Product Type */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Product Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as keyof typeof PRODUCT_TYPES }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {PRODUCT_TYPES[formData.type].description}
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={
                    formData.type === 'trip_template' ? 'e.g., 7-Day Italian Coast Adventure' :
                    formData.type === 'consultation' ? 'e.g., 1-Hour Europe Travel Consultation' :
                    'e.g., Custom Japan Trip Planning Service'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what makes this product special..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="99.99"
                  />
                </div>

                {formData.type === 'consultation' && (
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 1 hour, 30 minutes"
                    />
                  </div>
                )}

                {formData.type === 'trip_template' && (
                  <div className="space-y-2">
                    <Label htmlFor="tripLength">Trip Length (days) *</Label>
                    <Input
                      id="tripLength"
                      type="number"
                      min="1"
                      value={formData.tripLength}
                      onChange={(e) => setFormData(prev => ({ ...prev, tripLength: e.target.value }))}
                      placeholder="7"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Trip-specific fields */}
            {formData.type === 'trip_template' && (
              <>
                {/* Destinations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Destinations</h3>
                  <div className="space-y-2">
                    <Label htmlFor="destinations">Add Destinations *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="destinations"
                        value={formData.currentDestination}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentDestination: e.target.value }))}
                        placeholder="e.g., Rome, Italy"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddItem('destinations')
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleAddItem('destinations')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.destinations.map((dest, index) => (
                        <Badge key={index} variant="secondary" className="pl-3 pr-1">
                          {dest}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleRemoveItem('destinations', index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select 
                        value={formData.difficulty} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as 'easy' | 'moderate' | 'challenging' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="challenging">Challenging</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxGroupSize">Max Group Size</Label>
                      <Input
                        id="maxGroupSize"
                        type="number"
                        min="1"
                        value={formData.maxGroupSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxGroupSize: e.target.value }))}
                        placeholder="e.g., 12"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* What's Included */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What's Included</h3>
              <div className="space-y-2">
                <Label htmlFor="included">Add Included Items *</Label>
                <div className="flex gap-2">
                  <Input
                    id="included"
                    value={formData.currentIncluded}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentIncluded: e.target.value }))}
                    placeholder="e.g., Hotel accommodations, Daily breakfast"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddItem('included')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddItem('included')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.included.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm">• {item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveItem('included', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Highlights (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="highlights">Add Trip Highlights</Label>
                <div className="flex gap-2">
                  <Input
                    id="highlights"
                    value={formData.currentHighlight}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentHighlight: e.target.value }))}
                    placeholder="e.g., Visit the Colosseum"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddItem('highlights')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddItem('highlights')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.highlights.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm">• {item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveItem('highlights', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="tags">Add Search Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={formData.currentTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentTag: e.target.value }))}
                    placeholder="e.g., romantic, adventure, family"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddItem('tags')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddItem('tags')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="pl-3 pr-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveItem('tags', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardContent className="pt-0">
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/expert')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}