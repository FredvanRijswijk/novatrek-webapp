'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/use-admin'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminPermission } from '@/lib/models/admin'

interface AdminRouteProps {
  children: React.ReactNode
  requiredPermission?: {
    resource: AdminPermission['resource']
    action: AdminPermission['actions'][0]
  }
  fallbackUrl?: string
}

export function AdminRoute({ 
  children, 
  requiredPermission,
  fallbackUrl = '/dashboard' 
}: AdminRouteProps) {
  const router = useRouter()
  const { isAdmin, loading, hasPermission } = useAdmin()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push(fallbackUrl)
    }
  }, [isAdmin, loading, router, fallbackUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
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
              This section is restricted to NovaTrek administrators only.
              If you believe you should have access, please contact your system administrator.
            </p>
            <Button onClick={() => router.push(fallbackUrl)}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check specific permission if required
  if (requiredPermission) {
    const hasRequiredPermission = hasPermission(requiredPermission.resource, requiredPermission.action)
    
    if (!hasRequiredPermission) {
      return (
        <div className="container max-w-2xl mx-auto py-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-destructive" />
                <CardTitle>Insufficient Permissions</CardTitle>
              </div>
              <CardDescription>
                You don't have the required permissions for this action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You need <strong>{requiredPermission.action}</strong> permission for{' '}
                <strong>{requiredPermission.resource}</strong> to access this feature.
              </p>
              <Button onClick={() => router.push('/dashboard/admin/marketplace')}>
                Return to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}