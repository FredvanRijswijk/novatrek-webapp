import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firestore'
import type { TripShare, ShareSettings, SharePermissions } from '@/types/sharing'
import { customAlphabet } from 'nanoid'

// Generate URL-safe share tokens
const generateShareToken = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12)

export async function createTripShare(
  tripId: string, 
  ownerId: string,
  settings: ShareSettings
): Promise<TripShare> {
  const shareToken = generateShareToken()
  const shareId = `${tripId}_${shareToken}`
  
  const expiresAt = settings.expirationDays 
    ? new Date(Date.now() + settings.expirationDays * 24 * 60 * 60 * 1000)
    : null

  const permissions: SharePermissions = {
    view: true,
    comment: settings.allowComments,
    copy: settings.allowCopying,
    collaborate: false, // Future feature
  }

  const share: Omit<TripShare, 'id'> = {
    tripId,
    ownerId,
    shareToken,
    permissions,
    expiresAt,
    createdAt: new Date(),
    accessCount: 0,
  }

  await setDoc(doc(db, 'tripShares', shareId), {
    ...share,
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    createdAt: serverTimestamp(),
  })

  return { id: shareId, ...share }
}

export async function getTripShare(shareToken: string): Promise<TripShare | null> {
  try {
    // Query by shareToken field instead of document ID
    const q = query(
      collection(db, 'tripShares'), 
      where('shareToken', '==', shareToken)
    )
    
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null
    
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    
    // Check if share has expired
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return null
    }
    
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
      lastAccessedAt: data.lastAccessedAt?.toDate(),
    } as TripShare
  } catch (error) {
    console.error('Error getting trip share:', error)
    return null
  }
}

export async function updateShareAccess(shareId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'tripShares', shareId), {
      lastAccessedAt: serverTimestamp(),
      accessCount: (await getDoc(doc(db, 'tripShares', shareId))).data()?.accessCount + 1 || 1,
    })
  } catch (error) {
    console.error('Error updating share access:', error)
  }
}

export async function getUserSharedTrips(userId: string): Promise<TripShare[]> {
  try {
    const q = query(
      collection(db, 'tripShares'),
      where('ownerId', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
      lastAccessedAt: doc.data().lastAccessedAt?.toDate(),
    } as TripShare))
  } catch (error) {
    console.error('Error getting user shared trips:', error)
    return []
  }
}

export async function revokeShare(shareId: string, userId: string): Promise<boolean> {
  try {
    const shareDoc = await getDoc(doc(db, 'tripShares', shareId))
    if (!shareDoc.exists() || shareDoc.data()?.ownerId !== userId) {
      return false
    }
    
    await deleteDoc(doc(db, 'tripShares', shareId))
    return true
  } catch (error) {
    console.error('Error revoking share:', error)
    return false
  }
}

export async function updateShareSettings(
  shareId: string, 
  userId: string,
  settings: Partial<ShareSettings>
): Promise<boolean> {
  try {
    const shareDoc = await getDoc(doc(db, 'tripShares', shareId))
    if (!shareDoc.exists() || shareDoc.data()?.ownerId !== userId) {
      return false
    }
    
    const updates: any = {}
    
    if (settings.allowComments !== undefined) {
      updates['permissions.comment'] = settings.allowComments
    }
    if (settings.allowCopying !== undefined) {
      updates['permissions.copy'] = settings.allowCopying
    }
    if (settings.expirationDays !== undefined) {
      updates.expiresAt = settings.expirationDays 
        ? Timestamp.fromDate(new Date(Date.now() + settings.expirationDays * 24 * 60 * 60 * 1000))
        : null
    }
    
    await updateDoc(doc(db, 'tripShares', shareId), updates)
    return true
  } catch (error) {
    console.error('Error updating share settings:', error)
    return false
  }
}

// Generate shareable URL
export function getShareUrl(shareToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  return `${baseUrl}/shared/trip/${shareToken}`
}

// Copy trip from shared link
export async function copySharedTrip(
  shareToken: string,
  userId: string,
  newTripName?: string
): Promise<string | null> {
  try {
    const share = await getTripShare(shareToken)
    if (!share || !share.permissions.copy) return null
    
    // Get the original trip
    const tripDoc = await getDoc(doc(db, 'trips', share.tripId))
    if (!tripDoc.exists()) return null
    
    const originalTrip = tripDoc.data()
    const newTripId = doc(collection(db, 'trips')).id
    
    // Create a copy with new owner
    await setDoc(doc(db, 'trips', newTripId), {
      ...originalTrip,
      id: newTripId,
      userId,
      name: newTripName || `${originalTrip.name} (Copy)`,
      status: 'planning',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      copiedFrom: share.tripId,
    })
    
    return newTripId
  } catch (error) {
    console.error('Error copying shared trip:', error)
    return null
  }
}