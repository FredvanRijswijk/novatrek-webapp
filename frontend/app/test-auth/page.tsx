'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw } from 'lucide-react'

export default function TestAuthPage() {
  const { user, loading: authLoading, isAuthenticated } = useFirebase()
  const [testResults, setTestResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (user) {
      runTests()
    }
  }, [user])

  const runTests = async () => {
    if (!user) return
    
    setTesting(true)
    const results: any = {}
    
    // Test 1: Auth State
    results.authState = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providers: user.providerData.map(p => p.providerId)
    }
    
    // Test 2: ID Token
    try {
      const token = await user.getIdToken()
      results.idToken = {
        success: true,
        length: token.length
      }
    } catch (error: any) {
      results.idToken = {
        success: false,
        error: error.message
      }
    }
    
    // Test 3: User Document
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      results.userDocument = {
        exists: userDoc.exists(),
        data: userDoc.exists() ? userDoc.data() : null
      }
    } catch (error: any) {
      results.userDocument = {
        error: error.message,
        code: error.code
      }
    }
    
    // Test 4: Admin Document
    try {
      const adminDoc = await getDoc(doc(db, 'admin_users', user.uid))
      results.adminDocument = {
        exists: adminDoc.exists(),
        data: adminDoc.exists() ? adminDoc.data() : null
      }
    } catch (error: any) {
      results.adminDocument = {
        error: error.message,
        code: error.code
      }
    }
    
    // Test 5: Custom Claims
    try {
      const tokenResult = await user.getIdTokenResult()
      results.customClaims = tokenResult.claims
    } catch (error: any) {
      results.customClaims = {
        error: error.message
      }
    }
    
    setTestResults(results)
    setTesting(false)
  }

  const forceRefresh = async () => {
    try {
      await auth.currentUser?.reload()
      await runTests()
    } catch (error) {
      console.error('Error refreshing:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Alert>
          <AlertDescription>
            Please log in to run authentication tests.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        <Button onClick={forceRefresh} variant="outline" size="sm" disabled={testing}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          This page tests various authentication and permissions aspects to help debug issues.
        </AlertDescription>
      </Alert>

      {/* Test Results */}
      {Object.entries(testResults).map(([testName, result]) => (
        <Card key={testName}>
          <CardHeader>
            <CardTitle className="text-lg">{testName}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}

      {testing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}