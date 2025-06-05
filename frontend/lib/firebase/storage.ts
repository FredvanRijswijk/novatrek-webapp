import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage'
import { app } from './config'

// Initialize Firebase Storage
export const storage = getStorage(app)

// Helper to generate unique file names
const generateFileName = (originalName: string, prefix: string = ''): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `${prefix}${timestamp}_${randomString}.${extension}`
}

// Upload user profile photo
export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
  try {
    const fileName = generateFileName(file.name, 'profile_')
    const storageRef = ref(storage, `users/${userId}/profile/${fileName}`)
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    })
    
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    throw error
  }
}

// Upload trip photo
export const uploadTripPhoto = async (
  userId: string, 
  tripId: string, 
  file: File,
  metadata?: {
    activityId?: string
    dayNumber?: number
    caption?: string
  }
): Promise<{
  url: string
  path: string
  metadata: any
}> => {
  try {
    const fileName = generateFileName(file.name, 'trip_')
    const path = `trips/${tripId}/photos/${fileName}`
    const storageRef = ref(storage, path)
    
    const customMetadata: any = {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      tripId,
      ...metadata
    }
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata
    })
    
    const url = await getDownloadURL(snapshot.ref)
    
    return {
      url,
      path,
      metadata: customMetadata
    }
  } catch (error) {
    console.error('Error uploading trip photo:', error)
    throw error
  }
}

// Delete photo
export const deletePhoto = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

// Get all photos for a trip
export const getTripPhotos = async (tripId: string): Promise<Array<{
  url: string
  path: string
  name: string
}>> => {
  try {
    const listRef = ref(storage, `trips/${tripId}/photos`)
    const result = await listAll(listRef)
    
    const photos = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef)
        return {
          url,
          path: itemRef.fullPath,
          name: itemRef.name
        }
      })
    )
    
    return photos
  } catch (error) {
    console.error('Error getting trip photos:', error)
    return []
  }
}

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' }
  }
  
  return { valid: true }
}

// Resize image before upload (client-side)
export const resizeImage = async (
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to resize image'))
              return
            }
            
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            
            resolve(resizedFile)
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}