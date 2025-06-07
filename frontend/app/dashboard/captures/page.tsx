'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Link, MapPin, Calendar, DollarSign, Clock, Tag, Inbox, Folder, Search, Filter, ChevronRight, ExternalLink, Trash2, Edit, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { TravelCapture } from '@/lib/models/capture'
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formatDistanceToNow } from 'date-fns'

interface CaptureWithId extends TravelCapture {
  id: string
}

export default function CapturesPage() {
  const { user } = useFirebase()
  const [captures, setCaptures] = useState<CaptureWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCapture, setSelectedCapture] = useState<CaptureWithId | null>(null)
  const [filter, setFilter] = useState<'all' | 'unsorted' | 'sorted'>('unsorted')
  const [searchQuery, setSearchQuery] = useState('')
  const [trips, setTrips] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (user) {
      loadCaptures()
      loadTrips()
    }
  }, [user, filter])

  const loadCaptures = async () => {
    if (!user) return

    setLoading(true)
    try {
      const capturesRef = collection(db, 'captures')
      let q = query(
        capturesRef,
        where('userId', '==', user.uid),
        orderBy('capturedAt', 'desc'),
        limit(100)
      )

      if (filter === 'unsorted') {
        q = query(q, where('isSorted', '==', false))
      } else if (filter === 'sorted') {
        q = query(q, where('isSorted', '==', true))
      }

      const snapshot = await getDocs(q)
      const capturesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CaptureWithId[]

      setCaptures(capturesData)
    } catch (error) {
      console.error('Error loading captures:', error)
      toast.error('Failed to load captures')
    } finally {
      setLoading(false)
    }
  }

  const loadTrips = async () => {
    if (!user) return

    try {
      const tripsRef = collection(db, 'trips')
      const q = query(
        tripsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const tripsData = snapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Trip data:', doc.id, data)
        return {
          id: doc.id,
          name: data.title || 'Unnamed Trip'
        }
      })
      console.log('Loaded trips:', tripsData)
      setTrips(tripsData)
    } catch (error) {
      console.error('Error loading trips:', error)
      toast.error('Failed to load trips')
    }
  }

  const handleAssignToTrip = async (captureId: string, tripId: string) => {
    try {
      const captureRef = doc(db, 'captures', captureId)
      await updateDoc(captureRef, {
        assignedTo: tripId || null,
        isSorted: !!tripId,
        updatedAt: Timestamp.now()
      })
      
      toast.success(tripId ? 'Assigned to trip' : 'Moved to inbox')
      loadCaptures()
    } catch (error) {
      console.error('Error assigning capture:', error)
      toast.error('Failed to assign capture')
    }
  }

  const handleDelete = async (captureId: string) => {
    if (!confirm('Are you sure you want to delete this capture?')) return

    try {
      await deleteDoc(doc(db, 'captures', captureId))
      toast.success('Capture deleted')
      loadCaptures()
      setSelectedCapture(null)
    } catch (error) {
      console.error('Error deleting capture:', error)
      toast.error('Failed to delete capture')
    }
  }

  const filteredCaptures = captures.filter(capture => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      capture.title?.toLowerCase().includes(search) ||
      capture.content.toLowerCase().includes(search) ||
      capture.notes?.toLowerCase().includes(search) ||
      capture.tags.some(tag => tag.toLowerCase().includes(search))
    )
  })

  const renderCaptureCard = (capture: CaptureWithId) => {
    const timeAgo = formatDistanceToNow(capture.capturedAt.toDate(), { addSuffix: true })
    
    return (
      <Card 
        key={capture.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedCapture(capture)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base line-clamp-1">
                {capture.extractedData?.activity?.name || capture.title || capture.content.substring(0, 50)}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {timeAgo} via {capture.source}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {capture.isProcessed && (
                <Badge variant="outline" className="text-xs">
                  AI
                </Badge>
              )}
              {capture.contentType === 'link' && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {capture.extractedData?.aiSummary ? (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {capture.extractedData.aiSummary}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {capture.notes || capture.content}
            </p>
          )}
          
          <div className="space-y-2">
            {capture.extractedData?.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{capture.extractedData.location.city || capture.extractedData.location.name}</span>
              </div>
            )}
            
            {capture.extractedData?.price && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>{'$'.repeat(capture.extractedData.price.level || 1)}</span>
              </div>
            )}
            
            {capture.extractedData?.rating && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>⭐</span>
                <span>{capture.extractedData.rating}/5</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {(capture.extractedData?.aiTags || capture.tags).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {capture.assignedTo && (
              <Badge variant="default" className="text-xs">
                Assigned
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Travel Inbox</h2>
        <p className="text-muted-foreground">
          All your saved travel inspiration in one place
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search captures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unsorted">
                <Inbox className="h-4 w-4 mr-1" />
                Unsorted
              </TabsTrigger>
              <TabsTrigger value="sorted">
                <Folder className="h-4 w-4 mr-1" />
                Sorted
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* AI Processing Button - Only show if there are unprocessed captures */}
          {captures.some(c => !c.isProcessed) && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/captures-process');
                  const result = await response.json();
                  toast.success(`Processed ${result.processed} captures with AI`);
                  loadCaptures();
                } catch (error) {
                  toast.error('Failed to process captures');
                }
              }}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Process with AI
            </Button>
          )}
        </div>
      </div>

      {/* Captures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCaptures.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No captures match your search' : 'No captures yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Install the browser extension to start saving travel content
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCaptures.map(renderCaptureCard)
        )}
      </div>

      {/* Capture Detail Dialog */}
      <Dialog open={!!selectedCapture} onOpenChange={(open) => !open && setSelectedCapture(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCapture && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCapture.title || 'Untitled Capture'}</DialogTitle>
                <DialogDescription>
                  Saved {formatDistanceToNow(selectedCapture.capturedAt.toDate(), { addSuffix: true })} via {selectedCapture.source}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {selectedCapture.sourceUrl && (
                  <div>
                    <Label className="text-sm font-medium">Source</Label>
                    <a 
                      href={selectedCapture.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      {selectedCapture.sourceUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedCapture.content}</p>
                </div>

                {selectedCapture.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm mt-1">{selectedCapture.notes}</p>
                  </div>
                )}

                {selectedCapture.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedCapture.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCapture.extractedData && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">AI Extracted Information</Label>
                      
                      {selectedCapture.extractedData.location && (
                        <div className="text-sm">
                          <span className="font-medium">📍 Location:</span> {selectedCapture.extractedData.location.name}
                          {selectedCapture.extractedData.location.city && `, ${selectedCapture.extractedData.location.city}`}
                          {selectedCapture.extractedData.location.country && `, ${selectedCapture.extractedData.location.country}`}
                        </div>
                      )}
                      
                      {selectedCapture.extractedData.activity && (
                        <div className="text-sm">
                          <span className="font-medium">🎯 Type:</span> {selectedCapture.extractedData.activity.type}
                          {selectedCapture.extractedData.activity.description && ` - ${selectedCapture.extractedData.activity.description}`}
                        </div>
                      )}
                      
                      {selectedCapture.extractedData.price && (
                        <div className="text-sm">
                          <span className="font-medium">💰 Price:</span> {'$'.repeat(selectedCapture.extractedData.price.level || 1)}
                          {selectedCapture.extractedData.price.estimatedCost && 
                            ` (${selectedCapture.extractedData.price.currency || '$'}${selectedCapture.extractedData.price.estimatedCost.min}-${selectedCapture.extractedData.price.estimatedCost.max})`
                          }
                        </div>
                      )}
                      
                      {selectedCapture.extractedData.rating && (
                        <div className="text-sm">
                          <span className="font-medium">⭐ Rating:</span> {selectedCapture.extractedData.rating}/5
                        </div>
                      )}
                      
                      {selectedCapture.extractedData.openingHours && (
                        <div className="text-sm">
                          <span className="font-medium">🕐 Hours:</span> {selectedCapture.extractedData.openingHours.join(', ')}
                        </div>
                      )}
                      
                      {selectedCapture.extractedData.aiSummary && (
                        <div className="text-sm bg-muted p-2 rounded">
                          {selectedCapture.extractedData.aiSummary}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <Label htmlFor="assign-trip" className="text-sm font-medium">Assign to Trip</Label>
                  <Select
                    value={selectedCapture.assignedTo || 'unassigned'}
                    onValueChange={(value) => handleAssignToTrip(selectedCapture.id, value === 'unassigned' ? '' : value)}
                  >
                    <SelectTrigger id="assign-trip" className="mt-1">
                      <SelectValue placeholder="Select a trip..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned (Inbox)</SelectItem>
                      {trips.map(trip => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedCapture.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}