'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, MapPin, Star, Edit, Trash2, Eye, EyeOff, Sparkles, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { MarketplaceModel } from '@/lib/models/marketplace';
import { RecommendationModel, ExpertSavedPlace, PlaceRecommendation } from '@/lib/models/recommendations';
import { useGooglePlaces } from '@/hooks/use-google-places';

interface PublishDialogProps {
  place: ExpertSavedPlace;
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

function PublishRecommendationDialog({ place, isOpen, onClose, onPublish }: PublishDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [tips, setTips] = useState('');
  const [highlights, setHighlights] = useState('');

  const handlePublish = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your recommendation');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/expert/recommendations/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          savedPlaceId: place.id,
          reason: reason.trim(),
          description: description.trim() || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          tips: tips.split('\n').map(t => t.trim()).filter(Boolean),
          highlights: highlights.split('\n').map(t => t.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish');
      }
      
      toast.success('Recommendation published successfully!');
      onPublish();
      onClose();
    } catch (error) {
      console.error('Error publishing recommendation:', error);
      toast.error('Failed to publish recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Publish Recommendation</DialogTitle>
          <DialogDescription>
            Share {place.name} with travelers. Add details to help them make the most of their visit.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Why do you recommend this place? *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Hidden gem with authentic local cuisine and amazing sunset views"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context about what makes this place special..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="romantic, budget-friendly, family, local-favorite, hidden-gem"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tips">Expert Tips (one per line)</Label>
              <Textarea
                id="tips"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="Go early to avoid crowds&#10;Try the chef's special&#10;Book reservations in advance"
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="highlights">Must-Try Highlights (one per line)</Label>
              <Textarea
                id="highlights"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Sunset rooftop terrace&#10;Signature cocktails&#10;Live jazz on Fridays"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Recommendation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpertRecommendationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState<any>(null);
  const [savedPlaces, setSavedPlaces] = useState<ExpertSavedPlace[]>([]);
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlace, setSelectedPlace] = useState<ExpertSavedPlace | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  
  const { searchPlaces, loading: searchLoading } = useGooglePlaces();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadExpertData();
  }, []);

  const loadExpertData = async () => {
    if (!auth.currentUser) {
      router.push('/login');
      return;
    }

    try {
      // Check if user is an expert
      const expertProfile = await MarketplaceModel.getExpertByUserId(auth.currentUser.uid);
      if (!expertProfile || expertProfile.status !== 'active') {
        router.push('/dashboard');
        toast.error('Expert access required');
        return;
      }

      setExpert(expertProfile);

      // Load saved places and recommendations
      const [places, recs] = await Promise.all([
        RecommendationModel.getExpertSavedPlaces(expertProfile.id),
        RecommendationModel.getRecommendationsByExpert(expertProfile.id)
      ]);

      setSavedPlaces(places);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading expert data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchPlaces(searchQuery, {
        types: selectedType === 'all' ? undefined : [selectedType]
      });
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search places');
    }
  };

  const handleSavePlace = async (place: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/expert/places/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          googlePlaceId: place.place_id,
          name: place.name,
          location: {
            address: place.formatted_address || place.vicinity,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            city: place.address_components?.find((c: any) => 
              c.types.includes('locality')
            )?.long_name
          },
          type: place.types?.[0] || 'place',
          tags: place.types?.slice(0, 5) || [],
          personalNotes: ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save place');
      }

      toast.success('Place saved to your collection');
      loadExpertData(); // Reload data
      setShowSearchResults(false);
    } catch (error) {
      console.error('Error saving place:', error);
      toast.error('Failed to save place');
    }
  };

  const handleDeleteSavedPlace = async (placeId: string) => {
    if (!confirm('Are you sure you want to remove this place from your collection?')) {
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/expert/places/${placeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete place');
      }

      toast.success('Place removed from collection');
      loadExpertData();
    } catch (error) {
      console.error('Error deleting place:', error);
      toast.error('Failed to remove place');
    }
  };

  const handleToggleRecommendationStatus = async (recommendationId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/expert/recommendations/${recommendationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Recommendation ${currentStatus === 'active' ? 'hidden' : 'activated'}`);
      loadExpertData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update recommendation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Recommendations</h1>
        <p className="text-muted-foreground">
          Search and save places you love, then share them as expert recommendations
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search Places
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Save className="h-4 w-4 mr-2" />
            Saved Places ({savedPlaces.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            <Sparkles className="h-4 w-4 mr-2" />
            Published ({recommendations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Places to Recommend</CardTitle>
              <CardDescription>
                Search for places you want to save and potentially recommend to travelers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search restaurants, attractions, hotels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="restaurant">Restaurants</SelectItem>
                    <SelectItem value="lodging">Hotels</SelectItem>
                    <SelectItem value="tourist_attraction">Attractions</SelectItem>
                    <SelectItem value="cafe">Cafes</SelectItem>
                    <SelectItem value="bar">Bars</SelectItem>
                    <SelectItem value="museum">Museums</SelectItem>
                    <SelectItem value="park">Parks</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {showSearchResults && (
                <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No results found</p>
                  ) : (
                    searchResults.map((place) => (
                      <div key={place.place_id} className="flex items-start justify-between gap-4 p-3 hover:bg-accent rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{place.name}</h4>
                          <p className="text-sm text-muted-foreground">{place.formatted_address || place.vicinity}</p>
                          {place.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{place.rating}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSavePlace(place)}
                          disabled={savedPlaces.some(p => p.googlePlaceId === place.place_id)}
                        >
                          {savedPlaces.some(p => p.googlePlaceId === place.place_id) ? 'Saved' : 'Save'}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Saved Places</CardTitle>
              <CardDescription>
                Places you've saved that can be published as recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedPlaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No saved places yet</p>
                  <p className="text-sm mt-1">Search and save places to build your collection</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlaces.map((place) => (
                    <div key={place.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{place.name}</h4>
                          <p className="text-sm text-muted-foreground">{place.location.address}</p>
                          <div className="flex gap-2 mt-2">
                            {place.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                          {place.personalNotes && (
                            <p className="text-sm mt-2 italic text-muted-foreground">
                              Note: {place.personalNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!place.isPublic && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPlace(place);
                                setShowPublishDialog(true);
                              }}
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSavedPlace(place.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Published Recommendations</CardTitle>
              <CardDescription>
                Your public recommendations visible to travelers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No published recommendations yet</p>
                  <p className="text-sm mt-1">Publish saved places to share your expertise</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.name}</h4>
                            <Badge className={rec.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                              {rec.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.location.address}</p>
                          <p className="text-sm">{rec.reason}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {rec.stats.viewCount} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Save className="h-3 w-3" />
                              {rec.stats.saveCount} saves
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {rec.stats.usedInTrips} trips
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleRecommendationStatus(rec.id, rec.status)}
                          >
                            {rec.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/expert/recommendations/${rec.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPlace && (
        <PublishRecommendationDialog
          place={selectedPlace}
          isOpen={showPublishDialog}
          onClose={() => {
            setShowPublishDialog(false);
            setSelectedPlace(null);
          }}
          onPublish={loadExpertData}
        />
      )}
    </div>
  );
}