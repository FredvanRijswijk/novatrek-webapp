// Example of how to integrate the PackingChecklist component into a trip page

import { PackingChecklist } from './PackingChecklist'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

// In your trip planning page component:
export function TripPlanningPageExample({ tripId }: { tripId: string }) {
  return (
    <div>
      {/* Other trip planning content */}
      
      {/* Packing checklist button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Packing Checklist
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Trip Packing Checklist</DialogTitle>
          </DialogHeader>
          <PackingChecklist tripId={tripId} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Or you can use it directly in a tab:
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function TripTabsExample({ tripId }: { tripId: string }) {
  return (
    <Tabs defaultValue="itinerary" className="w-full">
      <TabsList>
        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        <TabsTrigger value="packing">Packing</TabsTrigger>
        <TabsTrigger value="budget">Budget</TabsTrigger>
      </TabsList>
      
      <TabsContent value="itinerary">
        {/* Itinerary content */}
      </TabsContent>
      
      <TabsContent value="packing">
        <PackingChecklist tripId={tripId} />
      </TabsContent>
      
      <TabsContent value="budget">
        {/* Budget content */}
      </TabsContent>
    </Tabs>
  )
}