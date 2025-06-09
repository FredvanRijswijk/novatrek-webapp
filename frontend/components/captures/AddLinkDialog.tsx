'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Link, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CaptureModelEnhanced } from '@/lib/models/capture-enhanced'
import { useFirebase } from '@/lib/firebase/context'

interface AddLinkDialogProps {
  onSuccess?: () => void
}

export function AddLinkDialog({ onSuccess }: AddLinkDialogProps) {
  const { user } = useFirebase()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    notes: '',
    tags: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in to add links')
      return
    }

    if (!formData.url) {
      toast.error('Please enter a URL')
      return
    }

    // Basic URL validation
    try {
      new URL(formData.url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setLoading(true)
    try {
      // Create capture data
      const captureData = {
        userId: user.uid,
        content: formData.url,
        contentType: 'link' as const,
        source: 'manual',
        sourceUrl: formData.url,
        title: formData.title || formData.url,
        notes: formData.notes,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        isProcessed: false,
        isSorted: false,
        capturedAt: new Date(),
      }

      // Save to database
      await CaptureModelEnhanced.create(captureData, user.uid)
      
      toast.success('Link added successfully!')
      
      // Reset form
      setFormData({
        url: '',
        title: '',
        notes: '',
        tags: ''
      })
      
      setOpen(false)
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error adding link:', error)
      toast.error('Failed to add link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Travel Link</DialogTitle>
            <DialogDescription>
              Save a travel-related link to your inbox for later reference
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">
                URL <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/travel-guide"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Amazing beach destination"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or thoughts about this link..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="beach, summer, europe (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}