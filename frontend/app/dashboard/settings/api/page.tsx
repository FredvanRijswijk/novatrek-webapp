'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Eye, EyeOff, RefreshCw, Smartphone, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  key: string
  userId: string
  name: string
  lastUsed?: Timestamp
  createdAt: Timestamp
  active: boolean
}

export default function APISettingsPage() {
  const { user } = useFirebase()
  const [apiKey, setApiKey] = useState<string>('')
  const [apiKeyDoc, setApiKeyDoc] = useState<ApiKey | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadApiKey()
    }
  }, [user])

  const loadApiKey = async () => {
    if (!user) return

    setLoading(true)
    try {
      const apiKeysRef = collection(db, 'apiKeys')
      const q = query(
        apiKeysRef,
        where('userId', '==', user.uid),
        where('active', '==', true)
      )
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = { id: doc.id, ...doc.data() } as ApiKey
        setApiKeyDoc(data)
        setApiKey(data.key)
      }
    } catch (error) {
      console.error('Error loading API key:', error)
      toast.error('Failed to load API key')
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    if (!user) return

    setIsGenerating(true)
    
    try {
      // Generate a secure key
      const key = `nvk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      
      // Deactivate existing keys
      if (apiKeyDoc) {
        await updateDoc(doc(db, 'apiKeys', apiKeyDoc.id), {
          active: false,
          deactivatedAt: Timestamp.now()
        })
      }
      
      // Create new key in Firestore
      const apiKeysRef = collection(db, 'apiKeys')
      const docRef = await addDoc(apiKeysRef, {
        key,
        userId: user.uid,
        name: 'iOS Shortcuts Key',
        active: true,
        createdAt: Timestamp.now(),
        createdBy: user.uid
      })
      
      const newKey: ApiKey = {
        id: docRef.id,
        key,
        userId: user.uid,
        name: 'iOS Shortcuts Key',
        active: true,
        createdAt: Timestamp.now()
      }
      
      setApiKeyDoc(newKey)
      setApiKey(key)
      
      toast.success('New API key generated and saved')
    } catch (error) {
      console.error('Error generating API key:', error)
      toast.error('Failed to generate API key')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API key copied to clipboard')
  }

  // Mask API key for display (show only last 4 characters)
  const maskApiKey = (key: string) => {
    if (!key) return ''
    const visibleChars = 4
    if (key.length <= visibleChars) return key
    return '•'.repeat(key.length - visibleChars) + key.slice(-visibleChars)
  }

  const shortcutExamples = [
    {
      name: 'Save URL',
      description: 'Save any webpage to your travel inbox',
      icon: '🔗',
    },
    {
      name: 'Save Location',
      description: 'Save current location or map link',
      icon: '📍',
    },
    {
      name: 'Quick Note',
      description: 'Save a quick travel idea or note',
      icon: '📝',
    },
    {
      name: 'Voice Save',
      description: '"Hey Siri, save this to NovaTrek"',
      icon: '🎤',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API & Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect NovaTrek with iOS Shortcuts and other apps
        </p>
      </div>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Key</CardTitle>
          <CardDescription>
            Use this key to authenticate with NovaTrek from iOS Shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!apiKey ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Generate an API key to start using iOS Shortcuts
              </p>
              <Button onClick={generateApiKey} disabled={isGenerating}>
                {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Generate API Key
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={showKey ? apiKey : maskApiKey(apiKey)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Keep your API key secure. Anyone with this key can save content to your account.
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={generateApiKey}
                  disabled={isGenerating}
                >
                  {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Regenerate Key
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will invalidate your current key
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* iOS Shortcuts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            iOS Shortcuts
          </CardTitle>
          <CardDescription>
            Save travel content from anywhere on your iPhone or iPad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {shortcutExamples.map((shortcut) => (
              <div
                key={shortcut.name}
                className="flex items-start space-x-3 rounded-lg border p-3"
              >
                <span className="text-2xl">{shortcut.icon}</span>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {shortcut.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Start</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy your API key above</li>
              <li>Open the Shortcuts app on your iPhone</li>
              <li>Create a new shortcut or download our templates</li>
              <li>Add your API key to the shortcut</li>
              <li>Start saving travel content instantly!</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a 
                href="/ios-shortcuts-setup" 
                target="_blank"
                rel="noopener noreferrer"
              >
                View Setup Guide
              </a>
            </Button>
            <Button variant="outline" disabled>
              Download Templates (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
          <CardDescription>
            For developers and power users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Endpoint URL</Label>
              <code className="block mt-1 p-2 bg-muted rounded text-sm">
                POST https://novatrek.app/api/shortcuts/capture
              </code>
            </div>

            <div>
              <Label>Headers</Label>
              <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
{`{
  "x-api-key": "YOUR_API_KEY",
  "Content-Type": "application/json"
}`}
              </pre>
            </div>

            <div>
              <Label>Request Body</Label>
              <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
{`{
  "url": "https://example.com",     // Optional
  "text": "Content to save",        // Optional
  "title": "My Travel Find",        // Optional
  "notes": "Additional notes",      // Optional
  "tags": ["restaurant", "paris"]   // Optional
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}