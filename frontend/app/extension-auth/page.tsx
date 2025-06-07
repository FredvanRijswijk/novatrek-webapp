'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { Loader2 } from 'lucide-react'

export default function ExtensionAuthPage() {
  const { user, isAuthenticated } = useFirebase()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')

  useEffect(() => {
    async function handleAuth() {
      if (!isAuthenticated || !user) {
        // Redirect to login
        window.location.href = '/login?from=extension&returnUrl=/extension-auth'
        return
      }

      try {
        // Get the ID token
        const token = await user.getIdToken()
        
        // Create a div with the token and user ID for the extension to read
        const tokenDiv = document.createElement('div')
        tokenDiv.id = 'extension-auth-token'
        tokenDiv.dataset.token = token
        tokenDiv.dataset.userId = user.uid
        tokenDiv.style.display = 'none'
        document.body.appendChild(tokenDiv)
        
        setStatus('success')
        
        // Show success message
        setTimeout(() => {
          // The extension should close this tab
          // If it doesn't, we'll close it ourselves
          window.close()
        }, 2000)
      } catch (error) {
        console.error('Failed to get auth token:', error)
        setStatus('error')
      }
    }

    handleAuth()
  }, [isAuthenticated, user])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'checking' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <h1 className="text-2xl font-semibold">Authenticating...</h1>
            <p className="text-muted-foreground">
              Connecting your browser extension to NovaTrek
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Success!</h1>
            <p className="text-muted-foreground">
              Your browser extension is now connected
            </p>
            <p className="text-sm text-muted-foreground">
              This window will close automatically...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Authentication Failed</h1>
            <p className="text-muted-foreground">
              There was an error connecting your extension
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}