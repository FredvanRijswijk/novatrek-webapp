'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'


interface Application {
  id: string
  userId: string
  businessName: string
  email: string
  phone?: string
  experience: string
  specializations: string[]
  portfolio?: string[]
  references?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'additional_info_required'
  reviewNotes?: string
  submittedAt: any
  reviewedAt?: any
  reviewedBy?: string
}

export default function MarketplaceApplicationsPage() {
  const { user } = useFirebase()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchApplications = async () => {
    // This will trigger a re-render when the snapshot listener updates
    // No need to manually fetch as we're using real-time listeners
  }

  // Subscribe to applications
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'marketplace_applications'),
      orderBy('submittedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[]
      setApplications(apps)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleStatusUpdate = async (status: 'approved' | 'rejected' | 'additional_info_required') => {
    if (!selectedApp || !user) return

    setProcessing(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/admin/marketplace/applications/${selectedApp.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: status === 'approved' ? 'approve' : 
                  status === 'rejected' ? 'reject' : 
                  'needs_info',
          reason: status === 'rejected' ? reviewNotes : undefined,
          infoNeeded: status === 'additional_info_required' ? reviewNotes : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update application')
      }

      // Refresh the applications list
      await fetchApplications()
      
      setSelectedApp(null)
      setReviewNotes('')
      toast.success(`Application ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully`)
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error("Failed to update application")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    additional_info_required: AlertCircle
  }

  const statusColors = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    additional_info_required: 'warning'
  } as const

  return (
    <AdminRoute>
      <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Applications</CardTitle>
          <CardDescription>
            Review and manage travel expert applications
          </CardDescription>
        </CardHeader>
        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const StatusIcon = statusIcons[app.status]
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.businessName}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {app.specializations.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {app.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.specializations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[app.status]} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {applications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No applications yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              {selectedApp?.businessName}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Contact Information</p>
                <p className="text-sm text-muted-foreground">{selectedApp.email}</p>
                {selectedApp.phone && (
                  <p className="text-sm text-muted-foreground">{selectedApp.phone}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Experience</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedApp.experience}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedApp.portfolio && selectedApp.portfolio.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Portfolio</p>
                  <div className="space-y-1">
                    {selectedApp.portfolio.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.references && selectedApp.references.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">References</p>
                  <div className="space-y-1">
                    {selectedApp.references.map((ref, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {ref}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.status === 'pending' && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Review Notes</p>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('additional_info_required')}
                      disabled={processing}
                    >
                      Request More Info
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={processing}
                    >
                      {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={processing}
                    >
                      {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}

              {selectedApp.reviewNotes && (
                <Alert>
                  <AlertDescription>
                    <strong>Previous Review Notes:</strong> {selectedApp.reviewNotes}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminRoute>
  )
}