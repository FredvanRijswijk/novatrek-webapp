'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function VerifyAdminPage() {
  const { user, loading: authLoading } = useFirebase()
  const [claims, setClaims] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const checkClaims = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const idTokenResult = await user.getIdTokenResult()
      setClaims(idTokenResult.claims)
      console.log('Custom claims:', idTokenResult.claims)
    } catch (error) {
      console.error('Error getting ID token:', error)
    } finally {
      setLoading(false)
    }
  }

  const forceRefresh = async () => {
    if (!user) return
    
    setRefreshing(true)
    try {
      // Force refresh the token
      await user.getIdToken(true)
      await checkClaims()
      alert('Token refreshed! Check the claims below.')
    } catch (error) {
      console.error('Error refreshing token:', error)
      alert('Error refreshing token. Check console.')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    checkClaims()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please sign in to check admin status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAdmin = claims?.admin === true || claims?.role === 'super_admin'

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Verification Status</CardTitle>
            <CardDescription>Checking Firebase custom claims for admin access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Info:</h3>
              <p>Email: {user.email}</p>
              <p>UID: {user.uid}</p>
            </div>

            <div className={`p-4 rounded-lg ${isAdmin ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">Admin Status:</h3>
              <p className={`text-lg ${isAdmin ? 'text-green-700' : 'text-red-700'}`}>
                {isAdmin ? '✅ You ARE a super admin' : '❌ You are NOT an admin'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Custom Claims:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(claims, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={forceRefresh} 
                disabled={refreshing}
              >
                {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Force Refresh Token
              </Button>
              
              {isAdmin && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard/admin/marketplace'}
                >
                  Go to Admin Dashboard
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600 mt-4">
              <p>⚠️ Important: After admin creation, you must:</p>
              <ol className="list-decimal list-inside mt-2">
                <li>Sign out completely</li>
                <li>Clear browser cache/cookies</li>
                <li>Sign in again to get new token with claims</li>
                <li>Or click "Force Refresh Token" above</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}