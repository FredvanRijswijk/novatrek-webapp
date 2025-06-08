'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteAllUserData, deleteUserAccount, exportUserData } from '@/lib/firebase/user-deletion'
import { signOutUser, resetPassword, sendVerificationEmail } from '@/lib/firebase/auth'
import { 
  Shield, 
  Key, 
  Smartphone, 
  Mail, 
  AlertCircle,
  AlertTriangle, 
  Download, 
  Trash2, 
  Loader2,
  CheckCircle,
  Clock,
  LogOut
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AccountPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [confirmEmail, setConfirmEmail] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [deletionReport, setDeletionReport] = useState<any>(null)

  // Session information
  const lastSignIn = user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null
  const accountCreated = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null

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
          await signOutUser()
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

  const handlePasswordReset = async () => {
    if (!user?.email) return

    setSendingReset(true)
    try {
      await resetPassword(user.email)
      toast.success('Password reset email sent! Check your inbox.')
      setShowPasswordResetDialog(false)
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Failed to send password reset email')
    } finally {
      setSendingReset(false)
    }
  }

  const handleResendVerification = async () => {
    if (!user) return

    setSendingVerification(true)
    try {
      await sendVerificationEmail(user)
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      console.error('Verification email error:', error)
      toast.error('Failed to send verification email')
    } finally {
      setSendingVerification(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account</h2>
        <p className="text-muted-foreground">
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            {user?.emailVerified ? (
              <Badge variant="default">
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={sendingVerification}
              >
                {sendingVerification ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            )}
            {/* DEBUG: Show verification button for testing */}
            {process.env.NODE_ENV === 'development' && user?.emailVerified && (
              <div className="ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                >
                  {sendingVerification ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Test Verify Email'
                  )}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">
                  {accountCreated ? format(accountCreated, 'MMM d, yyyy') : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Sign In</p>
                <p className="text-sm text-muted-foreground">
                  {lastSignIn ? format(lastSignIn, 'MMM d, yyyy h:mm a') : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Protect your account with additional security measures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  {user?.providerData?.[0]?.providerId === 'password' 
                    ? 'Manage your password security' 
                    : 'You sign in with Google'}
                </p>
              </div>
            </div>
            {user?.providerData?.[0]?.providerId === 'password' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswordResetDialog(true)}
              >
                Change Password
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your account data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Export Your Data</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Download a copy of all your NovaTrek data including profile, trips, and preferences.
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
          </div>

          <Separator />

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>About Your Photos:</strong> Trip photos are compressed before upload:
              <ul className="mt-2 ml-4 space-y-1 list-disc text-sm">
                <li>Photos are resized to max 1200x1200 pixels</li>
                <li>Quality is set to 85% to reduce file size</li>
                <li>All photos are stored in your personal storage path</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              We'll send you an email with instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              A password reset link will be sent to: <strong>{user?.email}</strong>
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordReset}
              disabled={sendingReset}
            >
              {sendingReset ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Deletion Report (for debugging, remove in production) */}
      {deletionReport && process.env.NODE_ENV === 'development' && (
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