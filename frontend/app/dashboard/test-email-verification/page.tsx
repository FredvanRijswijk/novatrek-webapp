'use client'

import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sendVerificationEmail } from '@/lib/firebase/auth'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function TestEmailVerificationPage() {
  const { user } = useFirebase()
  const [sending, setSending] = useState(false)

  const handleSendVerification = async () => {
    if (!user) return

    setSending(true)
    try {
      await sendVerificationEmail(user)
      toast.success('Verification email sent!')
    } catch (error) {
      console.error('Error sending verification email:', error)
      toast.error('Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email Verification Test</h2>
        <p className="text-muted-foreground">
          Debug page for testing email verification status and button
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current User Status</CardTitle>
          <CardDescription>Firebase authentication details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div>
              <span className="font-medium">UID:</span> {user?.uid || 'Not logged in'}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user?.email || 'No email'}
            </div>
            <div>
              <span className="font-medium">Email Verified:</span>{' '}
              <Badge variant={user?.emailVerified ? 'default' : 'secondary'}>
                {user?.emailVerified ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Provider:</span>{' '}
              {user?.providerData?.[0]?.providerId || 'Unknown'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Verification Button Test</CardTitle>
          <CardDescription>Test the verification email functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This button should only be visible for unverified email/password users.
            </p>
            <p className="text-sm text-muted-foreground">
              Google sign-in users automatically have verified emails.
            </p>
          </div>

          {/* Original conditional button */}
          <div className="p-4 border rounded-lg space-y-2">
            <p className="text-sm font-medium">Original Conditional Button:</p>
            {user?.emailVerified ? (
              <Badge variant="default">Email Verified</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendVerification}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            )}
          </div>

          {/* Force show button for testing */}
          <div className="p-4 border rounded-lg space-y-2">
            <p className="text-sm font-medium">Force Show Button (for testing):</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendVerification}
              disabled={sending || !user}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Email (Test)'
              )}
            </Button>
          </div>

          {/* Debug info */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs font-mono">
              Debug: user?.emailVerified = {String(user?.emailVerified)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}