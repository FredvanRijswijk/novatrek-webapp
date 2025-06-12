'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Plus, 
  Minus,
  Loader2, 
  Package, 
  Shirt, 
  Droplet, 
  Laptop, 
  Heart,
  Mountain,
  Sparkles,
  AlertCircle,
  X,
  Trash2,
  Cloud,
  Sun,
  CloudRain,
  Wind
} from 'lucide-react'
import { PackingListV2, PackingItemV2 } from '@/types/travel-v2'
import { PackingListModelV2 } from '@/lib/models/v2/packing-list-model-v2'
import { TripModelV2 } from '@/lib/models/v2/trip-model-v2'
import { DayModelV2 } from '@/lib/models/v2/day-model-v2'
import { useFirebase } from '@/lib/firebase/context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PackingChecklistV2Props {
  tripId: string
  onClose?: () => void
}

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  'Documents': Package,
  'Clothing': Shirt,
  'Personal Care': Droplet,
  'Electronics': Laptop,
  'Health': Heart,
  'Gear': Mountain,
  'Footwear': Package,
  'Accessories': Package,
  'Bags': Package,
  'Beach': Sun,
  'Activities': Mountain,
  'Office': Laptop,
  'Safety': AlertCircle,
  'Other': Package
}

export function PackingChecklistV2({ tripId, onClose }: PackingChecklistV2Props) {
  const { user } = useFirebase()
  const [packingList, setPackingList] = useState<PackingListV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState<Partial<PackingItemV2>>({
    name: '',
    category: 'Other',
    quantity: 1
  })
  const [weatherSummary, setWeatherSummary] = useState<{
    avgTemp: number
    hasRain: boolean
    conditions: string[]
  } | null>(null)
  
  const packingListModel = new PackingListModelV2()
  const tripModel = new TripModelV2()
  const dayModel = new DayModelV2()

  useEffect(() => {
    loadPackingList()
  }, [tripId])

  const loadPackingList = async () => {
    try {
      setLoading(true)
      
      // Load trip details and weather data
      const trip = await tripModel.getById(tripId)
      if (!trip) {
        toast.error('Trip not found')
        return
      }
      
      // Get weather summary from days
      const days = await dayModel.getTripDays(tripId)
      if (days.length > 0) {
        const temps: number[] = []
        let hasRain = false
        const conditions = new Set<string>()
        
        days.forEach(day => {
          if (day.weather) {
            temps.push(day.weather.temperature)
            if (day.weather.precipitation > 0) hasRain = true
            conditions.add(day.weather.condition)
          }
        })
        
        if (temps.length > 0) {
          setWeatherSummary({
            avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
            hasRain,
            conditions: Array.from(conditions)
          })
        }
      }
      
      // Load existing packing list
      const existingList = await packingListModel.getPrimaryPackingList(tripId)
      
      if (!existingList) {
        // Generate initial packing list based on trip type and weather
        await generateInitialPackingList(trip, days.length)
      } else {
        setPackingList(existingList)
      }
    } catch (error) {
      console.error('Error loading packing list:', error)
      toast.error('Failed to load packing list')
    } finally {
      setLoading(false)
    }
  }

  const generateInitialPackingList = async (trip: any, duration: number) => {
    try {
      setGeneratingAI(true)
      
      // Determine template based on destination or trip type
      let template: 'beach' | 'mountain' | 'city' | 'business' | 'adventure' = 'city'
      
      // Simple heuristic based on destination name (can be improved)
      const destinationName = trip.destination?.name?.toLowerCase() || ''
      if (destinationName.includes('beach') || destinationName.includes('coast')) {
        template = 'beach'
      } else if (destinationName.includes('mountain') || destinationName.includes('alps')) {
        template = 'mountain'
      } else if (destinationName.includes('business')) {
        template = 'business'
      }
      
      const newList = await packingListModel.generateFromTemplate(
        tripId,
        template,
        duration,
        trip.travelers?.length || 1,
        weatherSummary
      )
      
      setPackingList(newList)
      toast.success('Packing list generated!')
    } catch (error) {
      console.error('Error generating packing list:', error)
      toast.error('Failed to generate packing list')
    } finally {
      setGeneratingAI(false)
    }
  }

  const toggleItemCompletion = async (itemId: string) => {
    if (!packingList) return
    
    try {
      setSaving(true)
      await packingListModel.toggleItemCompletion(tripId, packingList.id, itemId)
      
      // Update local state
      const isCompleted = packingList.completedItems.includes(itemId)
      setPackingList({
        ...packingList,
        completedItems: isCompleted 
          ? packingList.completedItems.filter(id => id !== itemId)
          : [...packingList.completedItems, itemId],
        stats: {
          ...packingList.stats,
          completedItems: isCompleted 
            ? packingList.stats.completedItems - 1
            : packingList.stats.completedItems + 1
        }
      })
    } catch (error) {
      console.error('Error toggling item:', error)
      toast.error('Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  const addItem = async () => {
    if (!packingList || !newItem.name) return
    
    try {
      setSaving(true)
      const itemId = `custom-${Date.now()}`
      const item: PackingItemV2 = {
        id: itemId,
        name: newItem.name,
        category: newItem.category as PackingItemV2['category'],
        quantity: newItem.quantity || 1,
        customItem: true
      }
      
      const updatedItems = [...packingList.items, item]
      await packingListModel.updateItems(tripId, packingList.id, updatedItems)
      
      // Update local state
      setPackingList({
        ...packingList,
        items: updatedItems,
        stats: {
          ...packingList.stats,
          totalItems: updatedItems.length,
          categories: {
            ...packingList.stats.categories,
            [item.category]: (packingList.stats.categories[item.category] || 0) + 1
          }
        }
      })
      
      // Reset form
      setNewItem({ name: '', category: 'Other', quantity: 1 })
      setShowAddItem(false)
      toast.success('Item added!')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!packingList) return
    
    try {
      setSaving(true)
      const item = packingList.items.find(i => i.id === itemId)
      if (!item) return
      
      const updatedItems = packingList.items.filter(i => i.id !== itemId)
      await packingListModel.updateItems(tripId, packingList.id, updatedItems)
      
      // Update local state
      setPackingList({
        ...packingList,
        items: updatedItems,
        completedItems: packingList.completedItems.filter(id => id !== itemId),
        stats: {
          ...packingList.stats,
          totalItems: updatedItems.length,
          completedItems: packingList.completedItems.filter(id => id !== itemId).length,
          categories: {
            ...packingList.stats.categories,
            [item.category]: Math.max(0, (packingList.stats.categories[item.category] || 0) - 1)
          }
        }
      })
      
      toast.success('Item removed')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    } finally {
      setSaving(false)
    }
  }

  const updateQuantity = async (itemId: string, delta: number) => {
    if (!packingList) return
    
    const item = packingList.items.find(i => i.id === itemId)
    if (!item) return
    
    const newQuantity = Math.max(1, item.quantity + delta)
    if (newQuantity === item.quantity) return
    
    try {
      setSaving(true)
      const updatedItems = packingList.items.map(i => 
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      )
      await packingListModel.updateItems(tripId, packingList.id, updatedItems)
      
      setPackingList({
        ...packingList,
        items: updatedItems
      })
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    } finally {
      setSaving(false)
    }
  }

  const getFilteredItems = () => {
    if (!packingList) return []
    if (selectedCategory === 'all') return packingList.items
    return packingList.items.filter(item => item.category === selectedCategory)
  }

  const getCategories = () => {
    if (!packingList) return []
    const categories = Object.keys(packingList.stats.categories || {})
    return categories.filter(cat => packingList.stats.categories[cat] > 0)
  }

  const progress = packingList 
    ? Math.round((packingList.stats.completedItems / packingList.stats.totalItems) * 100) 
    : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading packing list...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!packingList) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No packing list found. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Packing Checklist</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {packingList.stats.completedItems} of {packingList.stats.totalItems} items packed
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Weather Summary */}
        {weatherSummary && (
          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>Avg: {weatherSummary.avgTemp}°C</span>
            </div>
            {weatherSummary.hasRain && (
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4" />
                <span>Rain expected</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <span>{weatherSummary.conditions.slice(0, 2).join(', ')}</span>
            </div>
          </div>
        )}
        
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      
      <CardContent>
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-4">
            <TabsTrigger value="all">
              All ({packingList.stats.totalItems})
            </TabsTrigger>
            {getCategories().map(category => {
              const Icon = categoryIcons[category] || Package
              return (
                <TabsTrigger key={category} value={category} className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {category}
                </TabsTrigger>
              )
            })}
          </TabsList>
          
          <TabsContent value={selectedCategory} className="space-y-2">
            {getFilteredItems().map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <Checkbox
                  checked={packingList.completedItems.includes(item.id)}
                  onCheckedChange={() => toggleItemCompletion(item.id)}
                  disabled={saving}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={packingList.completedItems.includes(item.id) ? 'line-through text-muted-foreground' : ''}>
                      {item.name}
                    </span>
                    {item.essential && (
                      <Badge variant="secondary" className="text-xs">Essential</Badge>
                    )}
                    {item.weatherDependent && (
                      <Badge variant="outline" className="text-xs">Weather</Badge>
                    )}
                    {item.customItem && (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={item.quantity <= 1 || saving}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={saving}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  {item.customItem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-2"
                      onClick={() => removeItem(item.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add Item Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddItem(true)}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Item
            </Button>
          </TabsContent>
        </Tabs>
        
        {/* Add Item Dialog */}
        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Travel adapter"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value as PackingItemV2['category'] })}
                  >
                    <SelectTrigger id="item-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categoryIcons).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
              <Button onClick={addItem} disabled={!newItem.name || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}