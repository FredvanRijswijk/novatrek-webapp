'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plane, 
  Plus, 
  Calendar,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  Users,
  Luggage
} from 'lucide-react'
import { FlightModel, FlightInfo } from '@/lib/models/flight'
import { format } from 'date-fns'
import { useFirebase } from '@/lib/firebase/context'

interface FlightTrackerProps {
  tripId: string
  onFlightAdded?: () => void
}

export function FlightTracker({ tripId, onFlightAdded }: FlightTrackerProps) {
  const { user } = useFirebase()
  const [flights, setFlights] = useState<FlightInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingFlight, setEditingFlight] = useState<FlightInfo | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: '',
    departureAirport: '',
    departureAirportCode: '',
    arrivalAirport: '',
    arrivalAirportCode: '',
    scheduledDepartureTime: '',
    scheduledArrivalTime: '',
    confirmationNumber: '',
    seatNumber: '',
    passengerName: ''
  })

  useEffect(() => {
    if (user?.uid) {
      loadFlights()
    }
  }, [user, tripId])

  const loadFlights = async () => {
    try {
      setLoading(true)
      const tripFlights = await FlightModel.getTripFlights(tripId)
      setFlights(tripFlights)
    } catch (error) {
      console.error('Error loading flights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    try {
      setSaving(true)
      
      const flightData: Omit<FlightInfo, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        tripId,
        userId: user.uid,
        scheduledDepartureTime: new Date(formData.scheduledDepartureTime),
        scheduledArrivalTime: new Date(formData.scheduledArrivalTime),
        status: 'scheduled'
      }

      if (editingFlight) {
        await FlightModel.update(editingFlight.id, flightData)
      } else {
        await FlightModel.create(flightData)
      }

      await loadFlights()
      resetForm()
      setShowAddDialog(false)
      setEditingFlight(null)
      onFlightAdded?.()
    } catch (error) {
      console.error('Error saving flight:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (flightId: string) => {
    if (confirm('Are you sure you want to delete this flight?')) {
      try {
        await FlightModel.delete(flightId)
        await loadFlights()
      } catch (error) {
        console.error('Error deleting flight:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      flightNumber: '',
      airline: '',
      departureAirport: '',
      departureAirportCode: '',
      arrivalAirport: '',
      arrivalAirportCode: '',
      scheduledDepartureTime: '',
      scheduledArrivalTime: '',
      confirmationNumber: '',
      seatNumber: '',
      passengerName: ''
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'departed':
        return <Plane className="h-4 w-4" />
      case 'arrived':
        return <CheckCircle className="h-4 w-4" />
      case 'delayed':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary'
      case 'departed':
        return 'default'
      case 'arrived':
        return 'default'
      case 'delayed':
        return 'destructive'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Information
            </CardTitle>
            <CardDescription>
              Track your flights and travel details
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingFlight ? 'Edit Flight' : 'Add Flight Details'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="flightNumber">Flight Number</Label>
                      <Input
                        id="flightNumber"
                        placeholder="AA123"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="airline">Airline</Label>
                      <Input
                        id="airline"
                        placeholder="American Airlines"
                        value={formData.airline}
                        onChange={(e) => setFormData({...formData, airline: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departureAirport">Departure Airport</Label>
                      <Input
                        id="departureAirport"
                        placeholder="Los Angeles International"
                        value={formData.departureAirport}
                        onChange={(e) => setFormData({...formData, departureAirport: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="departureAirportCode">Airport Code</Label>
                      <Input
                        id="departureAirportCode"
                        placeholder="LAX"
                        value={formData.departureAirportCode}
                        onChange={(e) => setFormData({...formData, departureAirportCode: e.target.value})}
                        required
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="arrivalAirport">Arrival Airport</Label>
                      <Input
                        id="arrivalAirport"
                        placeholder="John F. Kennedy International"
                        value={formData.arrivalAirport}
                        onChange={(e) => setFormData({...formData, arrivalAirport: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="arrivalAirportCode">Airport Code</Label>
                      <Input
                        id="arrivalAirportCode"
                        placeholder="JFK"
                        value={formData.arrivalAirportCode}
                        onChange={(e) => setFormData({...formData, arrivalAirportCode: e.target.value})}
                        required
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduledDepartureTime">Departure Time</Label>
                      <Input
                        id="scheduledDepartureTime"
                        type="datetime-local"
                        value={formData.scheduledDepartureTime}
                        onChange={(e) => setFormData({...formData, scheduledDepartureTime: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduledArrivalTime">Arrival Time</Label>
                      <Input
                        id="scheduledArrivalTime"
                        type="datetime-local"
                        value={formData.scheduledArrivalTime}
                        onChange={(e) => setFormData({...formData, scheduledArrivalTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="confirmationNumber">Confirmation #</Label>
                      <Input
                        id="confirmationNumber"
                        placeholder="ABC123"
                        value={formData.confirmationNumber}
                        onChange={(e) => setFormData({...formData, confirmationNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seatNumber">Seat Number</Label>
                      <Input
                        id="seatNumber"
                        placeholder="12A"
                        value={formData.seatNumber}
                        onChange={(e) => setFormData({...formData, seatNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passengerName">Passenger Name</Label>
                      <Input
                        id="passengerName"
                        placeholder="John Doe"
                        value={formData.passengerName}
                        onChange={(e) => setFormData({...formData, passengerName: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false)
                      setEditingFlight(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingFlight ? 'Update Flight' : 'Add Flight'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {flights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No flights added yet</p>
            <p className="text-sm mt-2">Add your flight details to track them during your trip</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => (
              <div
                key={flight.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(flight.status)}>
                      {getStatusIcon(flight.status)}
                      <span className="ml-1 capitalize">{flight.status}</span>
                    </Badge>
                    <div>
                      <h4 className="font-semibold">
                        {flight.airline} {flight.flightNumber}
                      </h4>
                      {flight.confirmationNumber && (
                        <p className="text-sm text-muted-foreground">
                          Confirmation: {flight.confirmationNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingFlight(flight)
                        setFormData({
                          flightNumber: flight.flightNumber,
                          airline: flight.airline,
                          departureAirport: flight.departureAirport,
                          departureAirportCode: flight.departureAirportCode,
                          arrivalAirport: flight.arrivalAirport,
                          arrivalAirportCode: flight.arrivalAirportCode,
                          scheduledDepartureTime: format(flight.scheduledDepartureTime, "yyyy-MM-dd'T'HH:mm"),
                          scheduledArrivalTime: format(flight.scheduledArrivalTime, "yyyy-MM-dd'T'HH:mm"),
                          confirmationNumber: flight.confirmationNumber || '',
                          seatNumber: flight.seatNumber || '',
                          passengerName: flight.passengerName || ''
                        })
                        setShowAddDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(flight.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Departure</span>
                    </div>
                    <p className="font-medium">{flight.departureAirportCode}</p>
                    <p className="text-xs text-muted-foreground">{flight.departureAirport}</p>
                    <p className="mt-1">
                      {format(flight.scheduledDepartureTime, 'MMM d, h:mm a')}
                    </p>
                    {flight.gate && <p className="text-xs">Gate: {flight.gate}</p>}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Arrival</span>
                    </div>
                    <p className="font-medium">{flight.arrivalAirportCode}</p>
                    <p className="text-xs text-muted-foreground">{flight.arrivalAirport}</p>
                    <p className="mt-1">
                      {format(flight.scheduledArrivalTime, 'MMM d, h:mm a')}
                    </p>
                    {flight.baggage && <p className="text-xs">Baggage: {flight.baggage}</p>}
                  </div>
                </div>

                {(flight.seatNumber || flight.passengerName) && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {flight.passengerName && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {flight.passengerName}
                      </div>
                    )}
                    {flight.seatNumber && (
                      <div className="flex items-center gap-1">
                        <Luggage className="h-4 w-4" />
                        Seat {flight.seatNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Flight tracking APIs can provide real-time updates. Popular options include FlightAware, 
            Aviation Stack, or FlightStats. Contact support to enable automatic flight tracking.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}