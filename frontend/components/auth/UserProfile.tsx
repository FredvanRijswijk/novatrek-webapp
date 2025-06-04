'use client'

import { useFirebase } from '@/lib/firebase'

export default function UserProfile() {
  const { user, isAuthenticated } = useFirebase()

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="bg-card border rounded-lg p-4 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-3">User Profile</h3>
      
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium text-muted-foreground">UID:</label>
          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {user.uid}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Display Name:</label>
          <p className="text-sm">
            {user.displayName || 'Not set'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email:</label>
          <p className="text-sm">
            {user.email || 'Not set'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email Verified:</label>
          <p className="text-sm">
            {user.emailVerified ? (
              <span className="text-green-600">✓ Verified</span>
            ) : (
              <span className="text-orange-600">⚠ Not verified</span>
            )}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Provider:</label>
          <p className="text-sm">
            {user.providerData[0]?.providerId || 'Unknown'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Created:</label>
          <p className="text-sm">
            {user.metadata.creationTime ? 
              new Date(user.metadata.creationTime).toLocaleDateString() : 
              'Unknown'
            }
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Last Sign In:</label>
          <p className="text-sm">
            {user.metadata.lastSignInTime ? 
              new Date(user.metadata.lastSignInTime).toLocaleDateString() : 
              'Unknown'
            }
          </p>
        </div>
      </div>
    </div>
  )
}