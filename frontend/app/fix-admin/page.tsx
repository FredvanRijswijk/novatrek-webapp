'use client'

import { useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function FixAdminPage() {
  const { user, isAuthenticated } = useFirebase()
  const [fixing, setFixing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixAdminDocument = async () => {
    if (!user) return
    
    setFixing(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          name: 'Fred',
          role: 'super_admin'
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setFixing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Alert>
          <AlertDescription>
            Please log in to fix admin document.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle>Fix Admin Document</CardTitle>
          <CardDescription>
            This will create or update your admin document in Firestore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm"><strong>User ID:</strong> {user?.uid}</p>
            <p className="text-sm"><strong>Email:</strong> {user?.email}</p>
            <p className="text-sm"><strong>Role:</strong> super_admin</p>
          </div>
          
          <Button 
            onClick={fixAdminDocument} 
            disabled={fixing}
            className="w-full"
          >
            {fixing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fix Admin Document
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
                  {result.error || result.message || 'Operation completed'}
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {result && !result.error && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}