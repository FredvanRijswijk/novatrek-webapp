'use client'

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
import { AlertTriangle } from 'lucide-react'

interface DeleteTripDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tripTitle: string
  isDeleting?: boolean
}

export function DeleteTripDialog({
  isOpen,
  onClose,
  onConfirm,
  tripTitle,
  isDeleting = false
}: DeleteTripDialogProps) {
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
                This action cannot be undone. All trip data including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Itinerary and activities</li>
                <li>Budget and expenses</li>
                <li>Photos and memories</li>
                <li>Flight information</li>
                <li>Packing lists</li>
                <li>Chat history</li>
              </ul>
              <p className="text-sm">
                will be permanently deleted.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Trip'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}