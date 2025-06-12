'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Phone, Globe, Star, DollarSign, Info, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityDetailsModalProps {
  activity: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToItinerary: (activity: any) => void;
  isAddingActivity?: boolean;
}

export function ActivityDetailsModal({
  activity,
  isOpen,
  onClose,
  onAddToItinerary,
  isAddingActivity = false
}: ActivityDetailsModalProps) {
  if (!activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{activity.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {activity.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{activity.address}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 flex-wrap">
                {activity.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{activity.rating}</span>
                    {activity.userRatingCount && (
                      <span className="text-sm text-muted-foreground">
                        ({activity.userRatingCount} reviews)
                      </span>
                    )}
                  </div>
                )}
                
                {activity.priceLevel && (
                  <div className="flex items-center">
                    {Array.from({ length: activity.priceLevel }).map((_, i) => (
                      <DollarSign key={i} className="h-4 w-4" />
                    ))}
                  </div>
                )}
                
                {activity.category && (
                  <Badge variant="outline" className="text-xs">
                    {activity.category}
                  </Badge>
                )}
                
                {activity.rankingFactors?.expertEndorsed && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Expert Pick
                  </Badge>
                )}
              </div>
              
              {/* Additional metadata */}
              {activity.type && (
                <p className="text-xs text-muted-foreground">
                  Type: {Array.isArray(activity.type) ? activity.type.join(', ') : activity.type}
                </p>
              )}
            </div>

            {activity.novatrekScore && (
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(activity.novatrekScore)}
                </div>
                <div className="text-xs text-muted-foreground">NovaTrek Score</div>
              </div>
            )}
          </div>

          {/* Photos */}
          {activity.photos && activity.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {activity.photos.slice(0, 4).map((photo: string, index: number) => (
                <div key={index} className="relative aspect-video">
                  <img
                    src={photo}
                    alt={`${activity.name} photo ${index + 1}`}
                    className="rounded-lg object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.jpg'; // You'll need to add a placeholder
                      target.onerror = null;
                    }}
                  />
                  {index === 3 && activity.photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium">+{activity.photos.length - 4} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {activity.description && (
                <Card className="p-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    About
                  </h3>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </Card>
              )}

              {activity.openingHours && Array.isArray(activity.openingHours) && activity.openingHours.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Opening Hours
                  </h3>
                  <div className="space-y-1 text-sm">
                    {activity.openingHours.map((hours: string, index: number) => (
                      <div key={index}>{hours}</div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card className="p-4 space-y-3">
                {/* Contact Information */}
                {(activity.phoneNumber || activity.website) && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm mb-2">Contact Information</h4>
                    
                    {activity.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${activity.phoneNumber}`} className="hover:underline">
                          {activity.phoneNumber}
                        </a>
                      </div>
                    )}

                    {activity.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={activity.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline text-primary"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Visit Information */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-medium text-sm mb-2">Visit Information</h4>
                  
                  {activity.duration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Suggested duration: {activity.duration} minutes</span>
                    </div>
                  )}

                  {activity.bookingRequired && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-orange-600">Booking required</span>
                      {activity.bookingUrl && (
                        <a 
                          href={activity.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1"
                        >
                          Book now
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Additional details */}
                  {activity.types && (
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Categories: </span>
                        {Array.isArray(activity.types) ? activity.types.join(', ') : activity.types}
                      </div>
                    </div>
                  )}
                  
                  {activity.placeId && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Google Place ID: {activity.placeId}</span>
                    </div>
                  )}
                </div>

                {/* Location */}
                {activity.location && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-medium text-sm mb-2">Location</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>Latitude: {activity.location.lat}</p>
                      <p>Longitude: {activity.location.lng || activity.location.lon}</p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Reviews coming soon...
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => {
                onAddToItinerary(activity);
                if (!isAddingActivity) {
                  onClose();
                }
              }}
              className="flex-1"
              disabled={isAddingActivity}
            >
              {isAddingActivity ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding to Itinerary...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Itinerary
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isAddingActivity}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}