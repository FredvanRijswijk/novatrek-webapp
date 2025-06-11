'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/use-admin'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TestRouteProps {
  children: React.ReactNode
  fallbackUrl?: string
}

export function TestRoute({ 
  children, 
  fallbackUrl = '/dashboard' 
}: TestRouteProps) {
  const router = useRouter()
  const { isAdmin, loading } = useAdmin()
  
  // Allow access in development or for admin users
  const hasAccess = process.env.NODE_ENV === 'development' || isAdmin

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.push(fallbackUrl)
    }
  }, [hasAccess, loading, router, fallbackUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This testing section is only available in development mode or for administrators.
            </p>
            <Button onClick={() => router.push(fallbackUrl)}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}