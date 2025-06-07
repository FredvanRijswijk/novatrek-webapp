'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { db } from '@/lib/firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function TestAdminSimplePage() {
  const { user, isAuthenticated } = useFirebase()
  const [result, setResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  
  const expectedUID = "JPwgiIT4wWYxmZE74LMhAT7LIUI2"
  const uidMatches = user?.uid === expectedUID

  const testAdminCreation = async () => {
    if (!user) return
    
    setTesting(true)
    setResult(null)
    
    try {
      // First, try to read the document
      const adminRef = doc(db, 'admin_users', user.uid)
      const adminSnap = await getDoc(adminRef)
      
      if (adminSnap.exists()) {
        setResult({
          success: false,
          message: 'Admin document already exists!',
          data: adminSnap.data()
        })
        return
      }
      
      // Try to create the document
      const adminData = {
        id: user.uid,
        userId: user.uid,
        email: user.email,
        name: 'Fred',
        role: 'super_admin',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Attempting to create admin document with data:', adminData)
      
      await setDoc(adminRef, adminData)
      
      setResult({
        success: true,
        message: 'Admin document created successfully!'
      })
    } catch (error: any) {
      console.error('Full error object:', error)
      setResult({
        success: false,
        error: error.message,
        code: error.code,
        details: error
      })
    } finally {
      setTesting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Alert>
          <AlertDescription>Please log in first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Creation Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current User Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Your UID:</span>{' '}
            <code className="bg-muted px-2 py-1 rounded text-sm">{user?.uid}</code>
          </div>
          <div>
            <span className="font-medium">Expected UID:</span>{' '}
            <code className="bg-muted px-2 py-1 rounded text-sm">{expectedUID}</code>
          </div>
          <div>
            <span className="font-medium">UID Match:</span>{' '}
            <Badge variant={uidMatches ? "default" : "destructive"}>
              {uidMatches ? "YES" : "NO"}
            </Badge>
          </div>
          {!uidMatches && (
            <Alert variant="destructive">
              <AlertDescription>
                Your UID doesn't match the one in the Firestore rules! 
                Update the rules with your actual UID: <code>{user?.uid}</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Admin Document Creation</CardTitle>
          <CardDescription>
            This will attempt to create an admin document with minimal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAdminCreation} disabled={testing}>
            {testing ? "Testing..." : "Test Create Admin Document"}
          </Button>
          
          {result && (
            <div className="space-y-2">
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
              
              {result.error && (
                <div className="text-sm space-y-1">
                  <p><strong>Error Code:</strong> {result.code}</p>
                  <p><strong>Error Message:</strong> {result.error}</p>
                </div>
              )}
              
              {result.data && (
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          {uidMatches ? (
            <p>Your UID matches! If creation is still failing, check the browser console for errors.</p>
          ) : (
            <div className="space-y-2">
              <p>To fix this issue:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Update firestore.rules line 248 with your UID: <code>{user?.uid}</code></li>
                <li>Run: <code>firebase deploy --only firestore:rules</code></li>
                <li>Try again</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}