'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useFirebase, createDocument, getCollection, subscribeToCollection, where, orderBy } from '@/lib/firebase'

interface TestDocument {
  id: string
  title: string
  content: string
  userId: string
  createdAt: any
  updatedAt: any
}

export default function FirestoreTest() {
  const { user, isAuthenticated } = useFirebase()
  const [documents, setDocuments] = useState<TestDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to user's documents
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setDocuments([])
      return
    }

    const unsubscribe = subscribeToCollection<TestDocument>(
      'test_documents',
      (docs) => setDocuments(docs),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    return () => unsubscribe()
  }, [isAuthenticated, user])

  const createTestDocument = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await createDocument('test_documents', {
        title: `Test Document ${Date.now()}`,
        content: 'This is a test document created from the app.',
        userId: user.uid,
      })
    } catch (error: any) {
      setError(error.message)
      console.error('Error creating document:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-card border rounded-lg p-4 max-w-md mx-auto">
        <p className="text-center text-muted-foreground">
          Sign in to test Firestore functionality
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg p-4 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-3">Firestore Test</h3>
      
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-3">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        <Button 
          onClick={createTestDocument}
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Test Document'}
        </Button>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Your Documents ({documents.length})</h4>
          
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet. Create one above!
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-muted p-2 rounded text-sm">
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-muted-foreground text-xs">
                    ID: {doc.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}