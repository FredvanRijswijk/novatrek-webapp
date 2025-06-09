'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Plane, 
  Car, 
  Train, 
  Bus, 
  Ship,
  MapPin,
  Clock,
  Calendar,
  Link,
  Hash,
  CreditCard,
  Users,
  X,
  Plus,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

export type TransportType = 'plane' | 'car' | 'train' | 'bus' | 'ferry' | 'rental_car'

export interface TravelSegment {
  id: string
  type: TransportType
  fromLocation: string
  toLocation: string
  departureDate: Date
  departureTime: string
  arrivalDate: Date
  arrivalTime: string
  isOvernight: boolean
  
  // Common fields
  operator?: string
  bookingNumber?: string
  confirmationNumber?: string
  notes?: string
  
  // Flight specific
  flightNumber?: string
  departureAirport?: string
  arrivalAirport?: string
  seatNumber?: string
  
  // Train/Bus specific
  trainNumber?: string
  busNumber?: string
  departureStation?: string
  arrivalStation?: string
  
  // Car rental specific
  rentalCompany?: string
  pickupLocation?: string
  dropoffLocation?: string
  vehicleType?: string
  
  // Ferry specific
  ferryOperator?: string
  departurePort?: string
  arrivalPort?: string
  cabinNumber?: string
  
  // Links and documents
  bookingLink?: string
  ticketUrl?: string
}

interface TravelSegmentProps {
  segment: TravelSegment
  onUpdate: (segment: TravelSegment) => void
  onDelete: () => void
}

const transportIcons: Record<TransportType, any> = {
  plane: Plane,
  car: Car,
  train: Train,
  bus: Bus,
  ferry: Ship,
  rental_car: Car
}

const transportLabels: Record<TransportType, string> = {
  plane: 'Flight',
  car: 'Car',
  train: 'Train',
  bus: 'Bus',
  ferry: 'Ferry',
  rental_car: 'Rental Car'
}

export function TravelSegmentCard({ segment, onUpdate, onDelete }: TravelSegmentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSegment, setEditedSegment] = useState(segment)
  
  const Icon = transportIcons[segment.type]
  
  const handleSave = () => {
    onUpdate(editedSegment)
    setIsEditing(false)
  }
  
  const formatDateTime = (date: Date, time: string) => {
    return `${format(date, 'MMM d')} at ${time}`
  }
  
  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {segment.fromLocation} 
                  <ChevronRight className="h-4 w-4" />
                  {segment.toLocation}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {transportLabels[segment.type]}
                  {segment.flightNumber && ` • ${segment.flightNumber}`}
                  {segment.trainNumber && ` • Train ${segment.trainNumber}`}
                  {segment.operator && ` • ${segment.operator}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Departure</p>
              <p className="font-medium">{formatDateTime(segment.departureDate, segment.departureTime)}</p>
              {segment.departureAirport && <p className="text-xs">{segment.departureAirport}</p>}
              {segment.departureStation && <p className="text-xs">{segment.departureStation}</p>}
            </div>
            <div>
              <p className="text-muted-foreground">Arrival</p>
              <p className="font-medium">{formatDateTime(segment.arrivalDate, segment.arrivalTime)}</p>
              {segment.arrivalAirport && <p className="text-xs">{segment.arrivalAirport}</p>}
              {segment.arrivalStation && <p className="text-xs">{segment.arrivalStation}</p>}
            </div>
          </div>
          
          {segment.isOvernight && (
            <div className="mt-3 text-sm text-muted-foreground">
              🌙 Overnight transport
            </div>
          )}
          
          {segment.bookingNumber && (
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Booking: </span>
              <span className="font-mono">{segment.bookingNumber}</span>
            </div>
          )}
          
          {segment.notes && (
            <div className="mt-3 text-sm text-muted-foreground">
              {segment.notes}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Travel Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transport Type</Label>
                <Select 
                  value={editedSegment.type} 
                  onValueChange={(value: TransportType) => setEditedSegment({...editedSegment, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plane">✈️ Flight</SelectItem>
                    <SelectItem value="train">🚆 Train</SelectItem>
                    <SelectItem value="bus">🚌 Bus</SelectItem>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="rental_car">🚙 Rental Car</SelectItem>
                    <SelectItem value="ferry">⛴️ Ferry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Operator/Company</Label>
                <Input 
                  value={editedSegment.operator || ''} 
                  onChange={(e) => setEditedSegment({...editedSegment, operator: e.target.value})}
                  placeholder="e.g., American Airlines, Amtrak"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input 
                  value={editedSegment.fromLocation} 
                  onChange={(e) => setEditedSegment({...editedSegment, fromLocation: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input 
                  value={editedSegment.toLocation} 
                  onChange={(e) => setEditedSegment({...editedSegment, toLocation: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Input 
                  type="date" 
                  value={format(editedSegment.departureDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEditedSegment({...editedSegment, departureDate: new Date(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Departure Time</Label>
                <Input 
                  type="time" 
                  value={editedSegment.departureTime}
                  onChange={(e) => setEditedSegment({...editedSegment, departureTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Arrival Date</Label>
                <Input 
                  type="date" 
                  value={format(editedSegment.arrivalDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEditedSegment({...editedSegment, arrivalDate: new Date(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Time</Label>
                <Input 
                  type="time" 
                  value={editedSegment.arrivalTime}
                  onChange={(e) => setEditedSegment({...editedSegment, arrivalTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={editedSegment.isOvernight}
                onCheckedChange={(checked) => setEditedSegment({...editedSegment, isOvernight: checked})}
              />
              <Label>Overnight transport</Label>
            </div>
            
            {/* Type-specific fields */}
            {editedSegment.type === 'plane' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Flight Number</Label>
                    <Input 
                      value={editedSegment.flightNumber || ''} 
                      onChange={(e) => setEditedSegment({...editedSegment, flightNumber: e.target.value})}
                      placeholder="AA123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seat Number</Label>
                    <Input 
                      value={editedSegment.seatNumber || ''} 
                      onChange={(e) => setEditedSegment({...editedSegment, seatNumber: e.target.value})}
                      placeholder="12A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departure Airport</Label>
                    <Input 
                      value={editedSegment.departureAirport || ''} 
                      onChange={(e) => setEditedSegment({...editedSegment, departureAirport: e.target.value})}
                      placeholder="JFK"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Arrival Airport</Label>
                    <Input 
                      value={editedSegment.arrivalAirport || ''} 
                      onChange={(e) => setEditedSegment({...editedSegment, arrivalAirport: e.target.value})}
                      placeholder="LAX"
                    />
                  </div>
                </div>
              </>
            )}
            
            {editedSegment.type === 'train' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Train Number</Label>
                  <Input 
                    value={editedSegment.trainNumber || ''} 
                    onChange={(e) => setEditedSegment({...editedSegment, trainNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seat/Cabin</Label>
                  <Input 
                    value={editedSegment.seatNumber || ''} 
                    onChange={(e) => setEditedSegment({...editedSegment, seatNumber: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {editedSegment.type === 'rental_car' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup Location</Label>
                  <Input 
                    value={editedSegment.pickupLocation || ''} 
                    onChange={(e) => setEditedSegment({...editedSegment, pickupLocation: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dropoff Location</Label>
                  <Input 
                    value={editedSegment.dropoffLocation || ''} 
                    onChange={(e) => setEditedSegment({...editedSegment, dropoffLocation: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Booking/Confirmation Number</Label>
              <Input 
                value={editedSegment.bookingNumber || ''} 
                onChange={(e) => setEditedSegment({...editedSegment, bookingNumber: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Booking Link</Label>
              <Input 
                value={editedSegment.bookingLink || ''} 
                onChange={(e) => setEditedSegment({...editedSegment, bookingLink: e.target.value})}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={editedSegment.notes || ''} 
                onChange={(e) => setEditedSegment({...editedSegment, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface AddTravelSegmentProps {
  onAdd: (segment: Omit<TravelSegment, 'id'>) => void
  defaultFromLocation?: string
  defaultToLocation?: string
  defaultDate?: Date
}

export function AddTravelSegment({ onAdd, defaultFromLocation, defaultToLocation, defaultDate }: AddTravelSegmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [segment, setSegment] = useState<Omit<TravelSegment, 'id'>>({
    type: 'plane',
    fromLocation: defaultFromLocation || '',
    toLocation: defaultToLocation || '',
    departureDate: defaultDate || new Date(),
    departureTime: '09:00',
    arrivalDate: defaultDate || new Date(),
    arrivalTime: '12:00',
    isOvernight: false
  })
  
  const handleAdd = () => {
    onAdd(segment)
    setIsOpen(false)
    // Reset form
    setSegment({
      type: 'plane',
      fromLocation: defaultFromLocation || '',
      toLocation: defaultToLocation || '',
      departureDate: defaultDate || new Date(),
      departureTime: '09:00',
      arrivalDate: defaultDate || new Date(),
      arrivalTime: '12:00',
      isOvernight: false
    })
  }
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Transport
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Travel Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transport Type</Label>
                <Select 
                  value={segment.type} 
                  onValueChange={(value: TransportType) => setSegment({...segment, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plane">✈️ Flight</SelectItem>
                    <SelectItem value="train">🚆 Train</SelectItem>
                    <SelectItem value="bus">🚌 Bus</SelectItem>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="rental_car">🚙 Rental Car</SelectItem>
                    <SelectItem value="ferry">⛴️ Ferry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input 
                  value={segment.fromLocation} 
                  onChange={(e) => setSegment({...segment, fromLocation: e.target.value})}
                  placeholder="City or location"
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input 
                  value={segment.toLocation} 
                  onChange={(e) => setSegment({...segment, toLocation: e.target.value})}
                  placeholder="City or location"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Input 
                  type="date" 
                  value={format(segment.departureDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSegment({...segment, departureDate: new Date(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Departure Time</Label>
                <Input 
                  type="time" 
                  value={segment.departureTime}
                  onChange={(e) => setSegment({...segment, departureTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Arrival Date</Label>
                <Input 
                  type="date" 
                  value={format(segment.arrivalDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSegment({...segment, arrivalDate: new Date(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Time</Label>
                <Input 
                  type="time" 
                  value={segment.arrivalTime}
                  onChange={(e) => setSegment({...segment, arrivalTime: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              Add Transport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}