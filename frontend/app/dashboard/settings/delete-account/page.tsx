'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteAllUserData, deleteUserAccount, exportUserData } from '@/lib/firebase/user-deletion'
import { signOut } from '@/lib/firebase/auth'
import { AlertTriangle, Download, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DeleteAccountPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [confirmEmail, setConfirmEmail] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deletionReport, setDeletionReport] = useState<any>(null)

  const handleExportData = async () => {
    if (!user) return

    setExporting(true)
    try {
      const data = await exportUserData(user.uid)
      
      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `novatrek-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Your data has been exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || confirmEmail !== user.email) return

    setDeleting(true)
    try {
      // First delete all user data
      const report = await deleteAllUserData(user.uid)
      setDeletionReport(report)
      
      if (report.success) {
        // Then delete the auth account
        try {
          await deleteUserAccount()
          toast.success('Your account has been permanently deleted')
          await signOut()
          router.push('/')
        } catch (authError: any) {
          if (authError.message.includes('re-authenticate')) {
            toast.error('Please sign out and sign in again before deleting your account')
            setShowDeleteDialog(false)
          } else {
            throw authError
          }
        }
      } else {
        toast.error('Failed to delete all data. Please contact support.')
      }
    } catch (error) {
      console.error('Deletion error:', error)
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Delete Account</h2>
        <p className="text-muted-foreground">
          Permanently delete your account and all associated data
        </p>
      </div>

      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download a copy of all your NovaTrek data before deleting your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This includes your profile, trips, itineraries, photos metadata, preferences, and chat history.
            Photos themselves will need to be downloaded separately from each trip.
          </p>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export My Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Photo Storage Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>About Your Photos:</strong> Trip photos are compressed before upload to save storage:
          <ul className="mt-2 ml-4 space-y-1 list-disc">
            <li>Photos are resized to max 1200x1200 pixels</li>
            <li>Quality is set to 85% to reduce file size</li>
            <li>Original files are not stored</li>
            <li>All photos are stored in your personal storage path</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Delete Account Section */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>
            Once you delete your account, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>This action will permanently delete:</strong>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>Your profile and account information</li>
                <li>All trips and itineraries</li>
                <li>All uploaded photos</li>
                <li>Travel preferences and settings</li>
                <li>Chat history and AI recommendations</li>
                <li>Any marketplace listings or applications</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="understood" 
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <Label 
              htmlFor="understood" 
              className="text-sm font-normal cursor-pointer"
            >
              I understand that this action is permanent and all my data will be lost forever
            </Label>
          </div>

          <Button
            variant="destructive"
            disabled={!understood}
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please type <strong>{user?.email}</strong> to confirm:
            </p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmEmail !== user?.email}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deletion Report */}
      {deletionReport && (
        <Card>
          <CardHeader>
            <CardTitle>Deletion Report</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(deletionReport, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}