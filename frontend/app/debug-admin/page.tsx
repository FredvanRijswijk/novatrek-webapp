'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { db } from '@/lib/firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function DebugAdminPage() {
  const { user, isAuthenticated } = useFirebase()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (result: any) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    if (!user) return
    
    setTesting(true)
    setResults([])
    
    try {
      // Test 1: Check current user
      addResult({
        test: 'User Authentication',
        uid: user.uid,
        email: user.email,
        isAuthenticated,
        expectedUid: 'JPwgiIT4wWYxmZE74LMhAT7LIUI2',
        uidMatches: user.uid === 'JPwgiIT4wWYxmZE74LMhAT7LIUI2'
      })

      // Test 2: Try to read the admin document
      try {
        const adminDocRef = doc(db, 'admin_users', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        addResult({
          test: 'Read Admin Document',
          exists: adminDoc.exists(),
          data: adminDoc.exists() ? adminDoc.data() : null,
          success: true
        })
      } catch (error: any) {
        addResult({
          test: 'Read Admin Document',
          error: error.message,
          code: error.code,
          success: false
        })
      }

      // Test 3: Try to create with exact rule requirements
      try {
        const adminData = {
          id: user.uid,
          userId: user.uid,
          email: user.email || '',
          name: 'Fred',
          role: 'super_admin',
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await setDoc(doc(db, 'admin_users', user.uid), adminData)
        
        addResult({
          test: 'Create Admin Document',
          success: true,
          message: 'Document created successfully!'
        })
      } catch (error: any) {
        addResult({
          test: 'Create Admin Document',
          error: error.message,
          code: error.code,
          details: error.details || 'No additional details',
          success: false
        })
      }

      // Test 4: Check Firebase project ID
      addResult({
        test: 'Firebase Configuration',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID,
        environment: process.env.NODE_ENV,
        firebaseEnv: process.env.NEXT_PUBLIC_FIREBASE_ENV
      })

    } catch (error: any) {
      addResult({
        test: 'General Error',
        error: error.message,
        success: false
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    if (user) {
      addResult({
        test: 'Initial Load',
        uid: user.uid,
        email: user.email,
        timestamp: new Date().toISOString()
      })
    }
  }, [user])

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto py-16">
        <Alert>
          <AlertDescription>
            Please log in to debug admin permissions.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle>Debug Admin Permissions</CardTitle>
          <CardDescription>
            Test Firestore rules and permissions for admin document creation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="w-full"
          >
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Permission Tests
          </Button>
          
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              {results.map((result, index) => (
                <Card key={index} className={result.success === false ? 'border-red-500' : ''}>
                  <CardContent className="pt-4">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}