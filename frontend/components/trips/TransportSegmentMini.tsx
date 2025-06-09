'use client'

import { format } from 'date-fns'
import { 
  Plane, 
  Train, 
  Car, 
  Bus, 
  Ship,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TravelSegment, TransportType } from './TravelSegment'

interface TransportSegmentMiniProps {
  segment: TravelSegment
  onClick?: () => void
}

const transportIcons: Record<TransportType, any> = {
  plane: Plane,
  car: Car,
  train: Train,
  bus: Bus,
  ferry: Ship,
  rental_car: Car
}

const transportColors: Record<TransportType, string> = {
  plane: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  car: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  train: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  bus: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  ferry: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  rental_car: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
}

export function TransportSegmentMini({ segment, onClick }: TransportSegmentMiniProps) {
  const Icon = transportIcons[segment.type]
  const colorClass = transportColors[segment.type]
  
  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${colorClass}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{segment.fromLocation}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{segment.toLocation}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3 w-3" />
          <span>{segment.departureTime}</span>
          {segment.flightNumber && (
            <Badge variant="outline" className="text-xs">
              {segment.flightNumber}
            </Badge>
          )}
        </div>
      </div>
      {segment.operator && (
        <div className="mt-1 text-xs opacity-80">
          {segment.operator}
        </div>
      )}
    </div>
  )
}

interface TransportDaySummaryProps {
  segments: TravelSegment[]
  date: Date
}

export function TransportDaySummary({ segments, date }: TransportDaySummaryProps) {
  if (segments.length === 0) return null
  
  return (
    <div className="space-y-2 mb-4">
      <h4 className="text-sm font-medium text-muted-foreground">
        🚀 Transport for {format(date, 'MMMM d')}
      </h4>
      {segments.map(segment => (
        <TransportSegmentMini key={segment.id} segment={segment} />
      ))}
    </div>
  )
}