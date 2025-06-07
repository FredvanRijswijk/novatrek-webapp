'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFirebase } from '@/lib/firebase'
import AuthButton from '@/components/auth/AuthButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, isAuthenticated } = useFirebase()
  const from = searchParams.get('from')

  useEffect(() => {
    if (isAuthenticated && !loading) {
      if (from === 'extension') {
        router.push('/extension-auth')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, loading, from, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to NovaTrek</CardTitle>
          <CardDescription>
            {from === 'extension' 
              ? 'Sign in to use the NovaTrek browser extension'
              : 'Sign in to start planning your next adventure'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AuthButton />
        </CardContent>
      </Card>
    </div>
  )
}