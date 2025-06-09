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
import { TravelCaptureEnhanced, CaptureModelEnhanced } from '@/lib/models/capture-enhanced'
import { TripModel } from '@/lib/models'
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formatDistanceToNow } from 'date-fns'
import { AddLinkDialog } from '@/components/captures/AddLinkDialog'

export default function CapturesPage() {
  const { user } = useFirebase()
  const [captures, setCaptures] = useState<TravelCaptureEnhanced[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCapture, setSelectedCapture] = useState<TravelCaptureEnhanced | null>(null)
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
      let capturesData: TravelCaptureEnhanced[] = []
      if (filter === 'unsorted') {
        capturesData = await CaptureModelEnhanced.getUnsortedCaptures(user.uid)
      } else {
        capturesData = await CaptureModelEnhanced.getUserCaptures(user.uid)
      }
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
      // Use TripModel which handles references properly
      const userTrips = await TripModel.getUserTrips(user.uid)
      const tripsData = userTrips.map(trip => ({
        id: trip.id,
        name: trip.title || 'Unnamed Trip'
      }))
      console.log('Loaded trips:', tripsData)
      setTrips(tripsData)
    } catch (error) {
      console.error('Error loading trips:', error)
      toast.error('Failed to load trips')
    }
  }

  const handleAssignToTrip = async (captureId: string, tripId: string) => {
    try {
      await CaptureModelEnhanced.assignToTrip(captureId, tripId || null)
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
      await CaptureModelEnhanced.delete(captureId)
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

  const renderCaptureCard = (capture: TravelCaptureEnhanced) => {
    const capturedAtDate = capture.capturedAt instanceof Date 
      ? capture.capturedAt 
      : capture.capturedAt.toDate()
    const timeAgo = formatDistanceToNow(capturedAtDate, { addSuffix: true })
    
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
          {capture.aiSummary ? (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {capture.aiSummary}
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
                <span>{'$'.repeat(capture.extractedData.price.priceLevel || 1)}</span>
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
            {(capture.aiTags || capture.tags).map(tag => (
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
          
          {/* Add Link Button */}
          <AddLinkDialog onSuccess={loadCaptures} />
          
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
                Add links manually or install the browser extension to save travel content
              </p>
              <div className="mt-4">
                <AddLinkDialog onSuccess={loadCaptures} />
              </div>
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
                  Saved {formatDistanceToNow(
                    selectedCapture.capturedAt instanceof Date 
                      ? selectedCapture.capturedAt 
                      : selectedCapture.capturedAt.toDate(), 
                    { addSuffix: true }
                  )} via {selectedCapture.source}
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
                          <span className="font-medium">💰 Price:</span> {'$'.repeat(selectedCapture.extractedData.price.priceLevel || 1)}
                          {selectedCapture.extractedData.price.amount && 
                            ` (${selectedCapture.extractedData.price.currency || '$'}${selectedCapture.extractedData.price.amount})`
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
                      
                      {selectedCapture.aiSummary && (
                        <div className="text-sm bg-muted p-2 rounded">
                          {selectedCapture.aiSummary}
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