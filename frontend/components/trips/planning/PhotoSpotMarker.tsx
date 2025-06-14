'use client';

import { useState } from 'react';
import { OverlayView } from '@react-google-maps/api';
import { Camera, Star, Clock, Users, TrendingUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PhotoSpot {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  rating: number;
  photos: number;
  bestTime: string;
  tips?: string;
  crowdLevel?: 'low' | 'medium' | 'high';
  instagramHandle?: string;
  tags?: string[];
}

interface PhotoSpotMarkerProps {
  spot: PhotoSpot;
  onClick: (spot: PhotoSpot) => void;
  isSelected?: boolean;
}

export function PhotoSpotMarker({ spot, onClick, isSelected = false }: PhotoSpotMarkerProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getCrowdIcon = () => {
    switch (spot.crowdLevel) {
      case 'low':
        return { icon: Users, color: 'text-green-500' };
      case 'medium':
        return { icon: Users, color: 'text-yellow-500' };
      case 'high':
        return { icon: Users, color: 'text-red-500' };
      default:
        return { icon: Users, color: 'text-gray-500' };
    }
  };

  const CrowdIcon = getCrowdIcon();

  return (
    <OverlayView
      position={spot.location}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="relative">
        {/* Main marker */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="relative cursor-pointer"
          onClick={() => {
            onClick(spot);
            setShowDetails(!showDetails);
          }}
        >
          <div className={cn(
            "relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-full",
            isSelected && "ring-4 ring-pink-500 ring-opacity-50"
          )}>
            <Camera className="w-6 h-6 text-white" />
            {/* Photo count badge */}
            <div className="absolute -top-2 -right-2 bg-white rounded-full px-2 py-0.5 shadow-md">
              <span className="text-xs font-bold text-gray-700">{spot.photos}+</span>
            </div>
          </div>
          
          {/* Pin stem */}
          <div className="absolute left-1/2 top-full w-0 h-0 transform -translate-x-1/2 -translate-y-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[12px] border-t-purple-600"></div>
          </div>

          {/* Pulse effect for popular spots */}
          {spot.photos > 1000 && (
            <div className="absolute inset-0 transform -translate-x-1/2 -translate-y-full">
              <div className="w-12 h-12 rounded-full bg-pink-400 animate-ping opacity-20"></div>
            </div>
          )}
        </motion.div>

        {/* Details popup */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute left-1/2 top-full mt-2 transform -translate-x-1/2 z-50"
            >
              <Card className="w-72 shadow-2xl">
                <CardContent className="p-4">
                  {/* Header with photo */}
                  <div className="relative h-32 -mx-4 -mt-4 mb-4">
                    <img
                      src={`https://source.unsplash.com/400x200/?${encodeURIComponent(spot.name)},landmark`}
                      alt={spot.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
                    <div className="absolute bottom-2 left-4 right-4">
                      <h3 className="text-white font-semibold text-lg">{spot.name}</h3>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{spot.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Camera className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold">{spot.photos}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Photos</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CrowdIcon.icon className={cn("w-4 h-4", CrowdIcon.color)} />
                        <span className="font-semibold capitalize">{spot.crowdLevel || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Crowd</p>
                    </div>
                  </div>

                  {/* Best time */}
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Best time: <strong>{spot.bestTime}</strong></span>
                  </div>

                  {/* Tips */}
                  {spot.tips && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4 inline mr-1 text-green-500" />
                        Pro tip: {spot.tips}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {spot.tags && spot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {spot.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to itinerary
                      }}
                    >
                      <MapPin className="w-3 h-3" />
                      Add to Trip
                    </Button>
                    {spot.instagramHandle && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://instagram.com/${spot.instagramHandle}`, '_blank');
                        }}
                      >
                        <Camera className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OverlayView>
  );
}