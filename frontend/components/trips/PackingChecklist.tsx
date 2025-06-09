'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Users,
  Sparkles,
  AlertCircle,
  X,
  UserPlus
} from 'lucide-react'
import { PackingList, PackingCategory, PackingItem } from '@/types/travel'
import { PackingModel } from '@/lib/models'
import { useFirebase } from '@/lib/firebase/context'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PackingChecklistProps {
  tripId: string
  trip?: any // Trip details for better loading messages
  onClose?: () => void
}

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  essentials: Package,
  clothes: Shirt,
  toiletries: Droplet,
  electronics: Laptop,
  health: Heart,
  outdoor: Mountain,
  shared: Users
}

export function PackingChecklist({ tripId, trip, onClose }: PackingChecklistProps) {
  const { user } = useFirebase()
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newItemName, setNewItemName] = useState('')
  const [showAddItem, setShowAddItem] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(0)
  
  const loadingMessages = [
    "Checking weather forecasts...",
    "Analyzing your planned activities...",
    "Selecting essential items...",
    "Adding weather-appropriate clothing...",
    "Including travel essentials...",
    "Finalizing your personalized list..."
  ]

  useEffect(() => {
    loadPackingList()
  }, [tripId])
  
  useEffect(() => {
    if (!loading) return
    
    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [loading, loadingMessages.length])

  const loadPackingList = async () => {
    try {
      setLoading(true)
      const list = await PackingModel.getByTripId(tripId)
      
      if (!list) {
        // Create a new packing list if none exists
        await createInitialPackingList()
      } else {
        setPackingList(list)
      }
    } catch (error) {
      console.error('Error loading packing list:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInitialPackingList = async () => {
    if (!user) return

    try {
      // Get trip details to determine the best template
      const token = await user.getIdToken()
      
      // First try to get AI-generated suggestions with template
      const response = await fetch('/api/ai/packing-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId,
          tripType: 'leisure', // Default, could be determined from trip
          useTemplate: true
        })
      })

      if (response.ok) {
        const { packingList: suggestedList } = await response.json()
        
        // Create the packing list with template items
        const packingListId = await PackingModel.create({
          tripId,
          userId: user.uid,
          name: 'Trip Packing List',
          categories: suggestedList.categories || []
        })

        const newList = await PackingModel.getById(packingListId)
        setPackingList(newList)
      } else {
        // Fallback to basic template
        const { findBestTemplate } = await import('@/lib/data/packing-templates')
        const template = findBestTemplate('leisure', 'temperate', 7) // Default values
        
        const packingListId = await PackingModel.create({
          tripId,
          userId: user.uid,
          name: 'Trip Packing List',
          categories: template?.categories || [
            {
              id: 'essentials',
              name: 'Essentials',
              icon: 'briefcase',
              order: 1,
              items: []
            },
            {
              id: 'clothes',
              name: 'Clothes',
              icon: 'shirt',
              order: 2,
              items: []
            },
            {
              id: 'toiletries',
              name: 'Toiletries',
              icon: 'droplet',
              order: 3,
              items: []
            },
            {
              id: 'electronics',
              name: 'Electronics',
              icon: 'laptop',
              order: 4,
              items: []
            }
          ]
        })

        const newList = await PackingModel.getById(packingListId)
        setPackingList(newList)
      }
    } catch (error) {
      console.error('Error creating packing list:', error)
    }
  }

  const toggleItem = async (categoryId: string, itemId: string) => {
    if (!packingList) return

    try {
      setSaving(true)
      await PackingModel.toggleItemChecked(packingList.id, categoryId, itemId)
      
      // Update local state
      const updatedCategories = packingList.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: cat.items.map(item => 
              item.id === itemId 
                ? { ...item, checked: !item.checked }
                : item
            )
          }
        }
        return cat
      })

      setPackingList({ ...packingList, categories: updatedCategories })
    } catch (error) {
      console.error('Error toggling item:', error)
    } finally {
      setSaving(false)
    }
  }

  const addItem = async (categoryId: string) => {
    if (!packingList || !newItemName.trim()) return

    try {
      setSaving(true)
      await PackingModel.addItem(packingList.id, categoryId, {
        name: newItemName.trim(),
        quantity: 1,
        checked: false
      })

      // Reload packing list
      await loadPackingList()
      setNewItemName('')
      setShowAddItem(null)
    } catch (error) {
      console.error('Error adding item:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (categoryId: string, itemId: string) => {
    if (!packingList) return

    try {
      setSaving(true)
      await PackingModel.removeItem(packingList.id, categoryId, itemId)
      await loadPackingList()
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateItemQuantity = async (categoryId: string, itemId: string, newQuantity: number) => {
    if (!packingList || newQuantity < 1) return

    try {
      setSaving(true)
      
      // Update local state immediately for better UX
      const updatedCategories = packingList.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: cat.items.map(item => 
              item.id === itemId 
                ? { ...item, quantity: newQuantity }
                : item
            )
          }
        }
        return cat
      })

      setPackingList({ ...packingList, categories: updatedCategories })
      
      // Update in database
      await PackingModel.updateItem(packingList.id, categoryId, itemId, { quantity: newQuantity })
    } catch (error) {
      console.error('Error updating item quantity:', error)
      // Reload to restore correct state on error
      await loadPackingList()
    } finally {
      setSaving(false)
    }
  }

  const generateAISuggestions = async () => {
    if (!packingList || !user) return

    try {
      setGeneratingAI(true)
      const token = await user.getIdToken()
      
      const response = await fetch('/api/ai/packing-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId,
          tripType: packingList.tripType || 'leisure',
          useTemplate: false // We already have items, just want suggestions
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.error || `Failed to generate suggestions (${response.status})`
        const hint = errorData?.hint || ''
        const details = errorData?.details || ''
        
        console.error('Packing suggestions error:', { errorMessage, hint, details })
        throw new Error(`${errorMessage}${hint ? ` - ${hint}` : ''}${details ? ` (${details})` : ''}`)
      }

      const { packingList: suggestedList } = await response.json()
      
      if (!suggestedList?.categories) {
        throw new Error('Invalid response from AI service')
      }
      
      // Count new items being added
      let newItemsCount = 0
      
      // Merge suggestions with existing list
      const updatedCategories = packingList.categories.map(existingCat => {
        const suggestedCat = suggestedList.categories.find(
          (cat: PackingCategory) => cat.name.toLowerCase() === existingCat.name.toLowerCase()
        )
        
        if (!suggestedCat) return existingCat
        
        // Only add new items that don't exist
        const existingItemNames = existingCat.items.map(item => item.name.toLowerCase())
        const newItems = suggestedCat.items.filter(
          (item: PackingItem) => !existingItemNames.includes(item.name.toLowerCase())
        ).map((item: PackingItem) => ({
          ...item,
          aiSuggested: true
        }))
        
        newItemsCount += newItems.length
        
        return {
          ...existingCat,
          items: [...existingCat.items, ...newItems]
        }
      })

      if (newItemsCount === 0) {
        alert('AI found no additional items to suggest. Your packing list looks complete!')
        return
      }

      await PackingModel.update(packingList.id, { categories: updatedCategories })
      await loadPackingList()
      
      alert(`Added ${newItemsCount} new AI-suggested items to your packing list!`)
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const getCategoryProgress = (category: PackingCategory) => {
    return PackingModel.getCategoryProgress(category)
  }

  const getOverallProgress = () => {
    if (!packingList) return 0
    return PackingModel.getProgress(packingList)
  }

  const filteredCategories = selectedCategory === 'all' 
    ? packingList?.categories || []
    : packingList?.categories.filter(cat => cat.id === selectedCategory) || []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 rounded-full bg-primary/10 animate-pulse" />
            </div>
            <div className="relative flex items-center justify-center">
              <Package className="h-16 w-16 text-primary animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Creating Your Perfect Packing List</h3>
            <p className="text-muted-foreground">
              {trip && trip.destinations && trip.destinations.length > 0 
                ? `Analyzing your ${trip.duration || ''} day journey to ${trip.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')}`
                : trip && trip.destination 
                  ? `Analyzing your ${trip.duration || ''} day trip to ${trip.destination.name}`
                  : 'Preparing your customized packing list'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Checking weather forecasts, considering your activities, and selecting essential items...
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="min-w-[200px] text-center">{loadingMessages[loadingMessage]}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!packingList) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Unable to load packing list</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* AI Generation Overlay */}
      {generatingAI && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-semibold">Generating AI Suggestions</p>
              <p className="text-sm text-muted-foreground mt-1">
                Analyzing your trip details and activities...
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Checklist</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {getOverallProgress()}% complete
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite friends
          </Button>
          <Button size="sm" onClick={generateAISuggestions} disabled={generatingAI}>
            {generatingAI ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Suggestions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Progress value={getOverallProgress()} className="h-2" />

      {/* Category tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {packingList.categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Category cards */}
        <div className="grid gap-4 mt-4">
          {filteredCategories.map(category => {
              const progress = getCategoryProgress(category)
              const Icon = categoryIcons[category.id] || Package

              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {progress.checked} / {progress.total}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{progress.percentage}%</div>
                        <Progress value={progress.percentage} className="h-1 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between group py-1">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={() => toggleItem(category.id, item.id)}
                              disabled={saving}
                            />
                            <label className={`text-sm flex-1 cursor-pointer ${
                              item.checked ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {item.name}
                            </label>
                            {item.aiSuggested && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateItemQuantity(category.id, item.id, Math.max(1, (item.quantity || 1) - 1))}
                              disabled={saving || (item.quantity || 1) <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm w-8 text-center">{item.quantity || 1}x</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateItemQuantity(category.id, item.id, (item.quantity || 1) + 1)}
                              disabled={saving}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 ml-2"
                              onClick={() => removeItem(category.id, item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add item */}
                      {showAddItem === category.id ? (
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Add item..."
                            className="h-9"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addItem(category.id)
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => addItem(category.id)}
                            disabled={!newItemName.trim() || saving}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowAddItem(null)
                              setNewItemName('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setShowAddItem(category.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add item
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
      </Tabs>

      {/* Invite friends dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Friends to Pack Together</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share packing responsibilities with your travel companions. They'll be able to see and check off shared items.
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This feature is coming soon! You'll be able to invite friends via email or share a link.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}