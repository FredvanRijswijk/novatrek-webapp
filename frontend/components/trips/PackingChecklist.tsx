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
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
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
import { PackingModel } from '@/lib/models/packing'
import { useFirebase } from '@/lib/firebase/context'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PackingChecklistProps {
  tripId: string
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

export function PackingChecklist({ tripId, onClose }: PackingChecklistProps) {
  const { user } = useFirebase()
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newItemName, setNewItemName] = useState('')
  const [showAddItem, setShowAddItem] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  useEffect(() => {
    loadPackingList()
  }, [tripId])

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
      // For now, create a basic packing list
      // In production, this would use templates or AI
      const packingListId = await PackingModel.create({
        tripId,
        userId: user.uid,
        name: 'Trip Packing List',
        categories: [
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
          },
          {
            id: 'shared',
            name: 'Shared packing',
            icon: 'users',
            order: 5,
            items: []
          }
        ]
      })

      const newList = await PackingModel.getById(packingListId)
      setPackingList(newList)
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

      if (!response.ok) throw new Error('Failed to generate suggestions')

      const { packingList: suggestedList } = await response.json()
      
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
        )
        
        return {
          ...existingCat,
          items: [...existingCat.items, ...newItems]
        }
      })

      await PackingModel.update(packingList.id, { categories: updatedCategories })
      await loadPackingList()
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    <div className="space-y-6">
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
              <Loader2 className="h-4 w-4 animate-spin" />
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
        <ScrollArea className="h-[500px] pr-4">
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
                        <div key={item.id} className="flex items-center justify-between group">
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
                              {item.quantity && item.quantity > 1 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({item.quantity})
                                </span>
                              )}
                            </label>
                            {item.aiSuggested && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeItem(category.id, item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
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
        </ScrollArea>
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