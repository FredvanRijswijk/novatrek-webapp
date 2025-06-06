'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Link, Mail, Check, Loader2, Shield, Globe, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { createTripShare, getShareUrl } from '@/lib/firebase/sharing'
import { useFeatureTracking } from '@/hooks/use-feature-flag'
import type { Trip } from '@/lib/models/trip'
import type { ShareSettings } from '@/types/sharing'

interface ShareTripDialogProps {
  trip: Trip
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareTripDialog({ trip, open, onOpenChange }: ShareTripDialogProps) {
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const { trackUsage } = useFeatureTracking('trip_sharing')
  
  // Share settings
  const [settings, setSettings] = useState<ShareSettings>({
    visibility: 'unlisted',
    allowComments: true,
    allowCopying: false,
    requireAuth: false,
    expirationDays: 30,
  })

  const handleCreateShare = async () => {
    setLoading(true)
    try {
      const share = await createTripShare(trip.id, trip.userId, settings)
      const url = getShareUrl(share.shareToken)
      setShareUrl(url)
      
      trackUsage('share_created', {
        tripId: trip.id,
        visibility: settings.visibility,
        expirationDays: settings.expirationDays,
      })
      
      toast.success('Share link created successfully!')
    } catch (error) {
      console.error('Error creating share:', error)
      toast.error('Failed to create share link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      trackUsage('share_copied', { tripId: trip.id })
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out my trip: ${trip.name}`)
    const body = encodeURIComponent(
      `I'd like to share my trip itinerary with you!\n\n${trip.name}\n${trip.description || ''}\n\nView it here: ${shareUrl}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
    trackUsage('share_emailed', { tripId: trip.id })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
          <DialogDescription>
            Create a link to share your trip itinerary with others
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-6">
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select 
                    value={settings.visibility} 
                    onValueChange={(v) => setSettings(s => ({ ...s, visibility: v as any }))}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>Public - Anyone can find and view</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="unlisted">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          <span>Unlisted - Only with link</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Private - Requires authentication</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration">Link expiration</Label>
                  <Select 
                    value={String(settings.expirationDays)} 
                    onValueChange={(v) => setSettings(s => ({ ...s, expirationDays: v === 'never' ? undefined : Number(v) }))}
                  >
                    <SelectTrigger id="expiration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.visibility === 'private' && (
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="requireAuth" className="flex-1">
                      Require sign in to view
                    </Label>
                    <Switch
                      id="requireAuth"
                      checked={settings.requireAuth}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, requireAuth: v }))}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="allowComments">Allow comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Viewers can leave comments and suggestions
                      </p>
                    </div>
                    <Switch
                      id="allowComments"
                      checked={settings.allowComments}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, allowComments: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="allowCopying">Allow copying</Label>
                      <p className="text-sm text-muted-foreground">
                        Viewers can copy this trip to their account
                      </p>
                    </div>
                    <Switch
                      id="allowCopying"
                      checked={settings.allowCopying}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, allowCopying: v }))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleCreateShare} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating share link...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Create Share Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm font-medium mb-2">Share link created!</p>
              <div className="flex items-center gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEmailShare}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Link
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(shareUrl, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShareUrl('')
                setSettings({
                  visibility: 'unlisted',
                  allowComments: true,
                  allowCopying: false,
                  requireAuth: false,
                  expirationDays: 30,
                })
              }}
            >
              Create Another Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}