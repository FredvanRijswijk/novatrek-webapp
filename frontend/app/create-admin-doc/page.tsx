'use client'

import { useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { db } from '@/lib/firebase/config'
import { doc, setDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const DEFAULT_PERMISSIONS = {
  super_admin: [
    { resource: 'marketplace', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'experts', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'products', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'transactions', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'applications', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'create', 'update', 'delete'] }
  ]
}

export default function CreateAdminDocPage() {
  const { user, isAuthenticated } = useFirebase()
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createAdminDocument = async () => {
    if (!user) return
    
    setCreating(true)
    setResult(null)
    
    try {
      // Create the admin document directly in Firestore
      const adminData = {
        id: user.uid,
        userId: user.uid,
        email: user.email || '',
        name: 'Fred',
        role: 'super_admin',
        permissions: DEFAULT_PERMISSIONS.super_admin,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await setDoc(doc(db, 'admin_users', user.uid), adminData)
      
      setResult({ 
        success: true, 
        message: 'Admin document created successfully! You can now access admin features.' 
      })
    } catch (error: any) {
      console.error('Error creating admin document:', error)
      setResult({ 
        error: true, 
        message: error.message || 'Failed to create admin document' 
      })
    } finally {
      setCreating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Alert>
          <AlertDescription>
            Please log in to create admin document.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create Admin Document</CardTitle>
          <CardDescription>
            This will create your admin document directly in Firestore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm"><strong>User ID:</strong> {user?.uid}</p>
            <p className="text-sm"><strong>Email:</strong> {user?.email}</p>
            <p className="text-sm"><strong>Role:</strong> super_admin</p>
          </div>
          
          <Alert>
            <AlertDescription>
              This will create an admin document with super_admin privileges. Make sure this is intended.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={createAdminDocument} 
            disabled={creating}
            className="w-full"
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Admin Document
          </Button>
          
          {result && (
            <Alert variant={result.error ? "destructive" : "default"}>
              <div className="flex items-center gap-2">
                {result.error ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {result && result.success && (
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/admin/marketplace'}
              >
                Go to Admin Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}