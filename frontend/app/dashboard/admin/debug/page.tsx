'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { useAdmin } from '@/hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { auth } from '@/lib/firebase/config'

export default function AdminDebugPage() {
  const { user, loading: authLoading, isAuthenticated } = useFirebase()
  const { isAdmin, adminUser, loading: adminLoading, refreshAdminStatus } = useAdmin()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const getToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken()
          setAuthToken(token)
          setTokenError(null)
        } catch (error: any) {
          setTokenError(error.message)
        }
      }
    }
    getToken()
  }, [user])

  const runServerTest = async () => {
    if (!user?.email) return
    
    setTesting(true)
    try {
      const response = await fetch(`/api/auth/test?email=${encodeURIComponent(user.email)}`)
      const data = await response.json()
      setTestResult(data)
    } catch (error: any) {
      setTestResult({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  const refreshAuth = async () => {
    try {
      await auth.currentUser?.reload()
      await refreshAdminStatus()
    } catch (error) {
      console.error('Error refreshing:', error)
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Authentication Debug</h1>
        <Button onClick={refreshAuth} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Firebase Authentication state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Authenticated:</span>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Yes" : "No"}
            </Badge>
          </div>
          {user && (
            <>
              <div className="text-sm">
                <span className="font-medium">UID:</span> <code>{user.uid}</code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email Verified:</span>{" "}
                <Badge variant={user.emailVerified ? "default" : "secondary"}>
                  {user.emailVerified ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Provider:</span> {user.providerData[0]?.providerId || "Unknown"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Status */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Status</CardTitle>
          <CardDescription>Admin role and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Is Admin:</span>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Yes" : "No"}
            </Badge>
          </div>
          {adminUser && (
            <>
              <div className="text-sm">
                <span className="font-medium">Role:</span>{" "}
                <Badge>{adminUser.role}</Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Active:</span>{" "}
                <Badge variant={adminUser.isActive ? "default" : "destructive"}>
                  {adminUser.isActive ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Permissions:</span>
                <div className="mt-1 space-y-1">
                  {adminUser.permissions.map((perm, idx) => (
                    <div key={idx} className="text-xs">
                      • {perm.resource}: {perm.actions.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ID Token */}
      <Card>
        <CardHeader>
          <CardTitle>ID Token Status</CardTitle>
          <CardDescription>Firebase ID token for authentication</CardDescription>
        </CardHeader>
        <CardContent>
          {tokenError ? (
            <Alert variant="destructive">
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
          ) : authToken ? (
            <div className="space-y-2">
              <Badge variant="outline" className="font-mono text-xs">
                Token Available
              </Badge>
              <div className="text-xs text-muted-foreground">
                Token length: {authToken.length} characters
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No token available</span>
          )}
        </CardContent>
      </Card>

      {/* Server Test */}
      <Card>
        <CardHeader>
          <CardTitle>Server-Side Verification</CardTitle>
          <CardDescription>Test admin status from server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runServerTest} disabled={!user || testing}>
            {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Run Server Test
          </Button>
          
          {testResult && (
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}