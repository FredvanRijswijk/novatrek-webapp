'use client'

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { getTripDeletionSummary } from '@/lib/firebase/trip-deletion'
import { useFirebase } from '@/lib/firebase/context'

interface DeleteTripDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tripTitle: string
  tripId?: string
  isDeleting?: boolean
}

export function DeleteTripDialog({
  isOpen,
  onClose,
  onConfirm,
  tripTitle,
  tripId,
  isDeleting = false
}: DeleteTripDialogProps) {
  const { user } = useFirebase()
  const [deletionSummary, setDeletionSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    if (isOpen && tripId && user) {
      setLoadingSummary(true)
      getTripDeletionSummary(tripId, user.uid)
        .then(summary => {
          setDeletionSummary(summary)
          setLoadingSummary(false)
        })
        .catch(error => {
          console.error('Error getting deletion summary:', error)
          setLoadingSummary(false)
        })
    }
  }, [isOpen, tripId, user])

  const hasData = deletionSummary && Object.values(deletionSummary).some((count: any) => count > 0)

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete <span className="font-semibold">"{tripTitle}"</span>?
              </p>
              <p className="font-semibold text-destructive">
                This action cannot be undone.
              </p>
              
              {loadingSummary ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : hasData ? (
                <>
                  <p className="text-sm">The following data will be permanently deleted:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {deletionSummary.days > 0 && (
                      <li>Itinerary days and activities</li>
                    )}
                    {deletionSummary.chatMessages > 0 && (
                      <li>{deletionSummary.chatMessages} chat messages</li>
                    )}
                    {deletionSummary.packingLists > 0 && (
                      <li>{deletionSummary.packingLists} packing list{deletionSummary.packingLists > 1 ? 's' : ''}</li>
                    )}
                    {deletionSummary.flights > 0 && (
                      <li>{deletionSummary.flights} flight{deletionSummary.flights > 1 ? 's' : ''}</li>
                    )}
                    {deletionSummary.travelSegments > 0 && (
                      <li>{deletionSummary.travelSegments} transport segment{deletionSummary.travelSegments > 1 ? 's' : ''}</li>
                    )}
                    {deletionSummary.photos > 0 && (
                      <li>{deletionSummary.photos} photo{deletionSummary.photos > 1 ? 's' : ''}</li>
                    )}
                    {deletionSummary.captures > 0 && (
                      <li>{deletionSummary.captures} quick capture{deletionSummary.captures > 1 ? 's' : ''}</li>
                    )}
                    {deletionSummary.tripShares > 0 && (
                      <li>{deletionSummary.tripShares} shared link{deletionSummary.tripShares > 1 ? 's' : ''}</li>
                    )}
                  </ul>
                </>
              ) : (
                <p className="text-sm">All trip data will be permanently deleted.</p>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                This deletion is GDPR compliant and will remove all associated personal data.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting || loadingSummary}
          >
            {isDeleting ? 'Deleting...' : 'Delete Trip'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}