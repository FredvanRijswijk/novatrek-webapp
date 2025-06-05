'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { uploadTripPhoto, validateImageFile, resizeImage, getTripPhotos, deletePhoto } from '@/lib/firebase/storage'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface PhotoUploadProps {
  tripId: string
  userId: string
  onPhotoUploaded?: (photo: { url: string; path: string }) => void
  maxPhotos?: number
  className?: string
  activityId?: string
  dayNumber?: number
}

export function PhotoUpload({
  tripId,
  userId,
  onPhotoUploaded,
  maxPhotos = 10,
  className,
  activityId,
  dayNumber
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<Array<{ url: string; path: string; name: string }>>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)

  // Load existing photos
  useEffect(() => {
    getTripPhotos(tripId).then(existingPhotos => {
      setPhotos(existingPhotos)
      setLoadingPhotos(false)
    }).catch(error => {
      console.error('Failed to load photos:', error)
      setLoadingPhotos(false)
    })
  }, [tripId])

  const handleUpload = async (files: File[]) => {
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)
    const uploadPromises = files.map(async (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        return null
      }

      try {
        const resizedFile = await resizeImage(file)
        const result = await uploadTripPhoto(userId, tripId, resizedFile, {
          activityId,
          dayNumber
        })
        
        return result
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Failed to upload ${file.name}`)
        return null
      }
    })

    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter(Boolean) as Array<{ url: string; path: string }>

    if (successfulUploads.length > 0) {
      setPhotos(prev => [...prev, ...successfulUploads.map(u => ({ ...u, name: '' }))])
      successfulUploads.forEach(photo => onPhotoUploaded?.(photo))
      toast.success(`Uploaded ${successfulUploads.length} photo${successfulUploads.length > 1 ? 's' : ''}`)
    }

    setUploading(false)
  }

  const handleDelete = async (photoPath: string) => {
    try {
      await deletePhoto(photoPath)
      setPhotos(prev => prev.filter(p => p.path !== photoPath))
      toast.success('Photo deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete photo')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleUpload(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: maxPhotos - photos.length,
    disabled: uploading || photos.length >= maxPhotos
  })

  if (loadingPhotos) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Uploading photos...</p>
            </div>
          ) : isDragActive ? (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm">Drop photos here</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                {maxPhotos - photos.length} photo{maxPhotos - photos.length !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <Card key={photo.path} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={photo.url}
                  alt={`Trip photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(photo.path)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}