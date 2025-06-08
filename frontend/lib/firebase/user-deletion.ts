import { auth } from './auth'
import { deleteUser as deleteAuthUser } from 'firebase/auth'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch
} from 'firebase/firestore'
import { ref, listAll, deleteObject } from 'firebase/storage'
import { db } from './firestore'
import { storage } from './storage'

interface DeletionReport {
  success: boolean
  deletedItems: {
    firestore: {
      trips: number
      captures: number
      chats: number
      preferences: number
      marketplace: number
    }
    storage: {
      profilePhotos: number
      tripPhotos: number
      totalSizeMB: number
    }
  }
  errors: string[]
}

/**
 * Delete all user data from Firestore and Storage
 * This function ensures GDPR compliance by removing all user data
 */
export async function deleteAllUserData(userId: string): Promise<DeletionReport> {
  const report: DeletionReport = {
    success: true,
    deletedItems: {
      firestore: {
        trips: 0,
        captures: 0,
        chats: 0,
        preferences: 0,
        marketplace: 0
      },
      storage: {
        profilePhotos: 0,
        tripPhotos: 0,
        totalSizeMB: 0
      }
    },
    errors: []
  }

  try {
    // 1. Delete Firestore data
    await deleteFirestoreData(userId, report)
    
    // 2. Delete Storage data
    await deleteStorageData(userId, report)
    
    // 3. Delete user account (optional - can be called separately)
    // await deleteUserAccount()
    
  } catch (error) {
    report.success = false
    report.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return report
}

/**
 * Delete all Firestore documents for a user
 */
async function deleteFirestoreData(userId: string, report: DeletionReport): Promise<void> {
  const batch = writeBatch(db)
  
  try {
    // Delete trips
    const tripsQuery = query(collection(db, 'trips'), where('userId', '==', userId))
    const tripsSnapshot = await getDocs(tripsQuery)
    tripsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      report.deletedItems.firestore.trips++
    })

    // Delete captures
    const capturesQuery = query(collection(db, 'captures'), where('userId', '==', userId))
    const capturesSnapshot = await getDocs(capturesQuery)
    capturesSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      report.deletedItems.firestore.captures++
    })

    // Delete chats
    const chatsQuery = query(collection(db, 'chats'), where('userId', '==', userId))
    const chatsSnapshot = await getDocs(chatsQuery)
    chatsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      report.deletedItems.firestore.chats++
    })

    // Delete travel preferences
    const preferencesDoc = doc(db, 'travelPreferences', userId)
    batch.delete(preferencesDoc)
    report.deletedItems.firestore.preferences = 1

    // Delete marketplace data (expert applications, products, etc.)
    const expertAppsQuery = query(collection(db, 'expertApplications'), where('userId', '==', userId))
    const expertAppsSnapshot = await getDocs(expertAppsQuery)
    expertAppsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      report.deletedItems.firestore.marketplace++
    })

    const productsQuery = query(collection(db, 'products'), where('expertId', '==', userId))
    const productsSnapshot = await getDocs(productsQuery)
    productsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      report.deletedItems.firestore.marketplace++
    })

    // Delete user document
    const userDoc = doc(db, 'users', userId)
    batch.delete(userDoc)

    // Commit all deletions
    await batch.commit()
    
  } catch (error) {
    report.errors.push(`Firestore deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

/**
 * Delete all Storage files for a user
 */
async function deleteStorageData(userId: string, report: DeletionReport): Promise<void> {
  let totalSize = 0

  try {
    // Delete profile photos
    const profileRef = ref(storage, `users/${userId}/profile`)
    const profileFiles = await listAll(profileRef)
    
    for (const item of profileFiles.items) {
      const metadata = await item.getMetadata()
      totalSize += metadata.size || 0
      await deleteObject(item)
      report.deletedItems.storage.profilePhotos++
    }

    // Delete trip photos
    // First, get all trips for the user to find their photo paths
    const tripsQuery = query(collection(db, 'trips'), where('userId', '==', userId))
    const tripsSnapshot = await getDocs(tripsQuery)
    
    for (const tripDoc of tripsSnapshot.docs) {
      const tripId = tripDoc.id
      const tripPhotosRef = ref(storage, `trips/${tripId}/photos`)
      
      try {
        const tripFiles = await listAll(tripPhotosRef)
        
        for (const item of tripFiles.items) {
          const metadata = await item.getMetadata()
          totalSize += metadata.size || 0
          await deleteObject(item)
          report.deletedItems.storage.tripPhotos++
        }
      } catch (error) {
        // Trip might not have photos
        console.log(`No photos found for trip ${tripId}`)
      }
    }

    // Convert bytes to MB
    report.deletedItems.storage.totalSizeMB = totalSize / (1024 * 1024)
    
  } catch (error) {
    report.errors.push(`Storage deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

/**
 * Delete the user's authentication account
 * Note: User must be recently authenticated for this to work
 */
export async function deleteUserAccount(): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No authenticated user found')
  }

  try {
    await deleteAuthUser(user)
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please re-authenticate before deleting your account')
    }
    throw error
  }
}

/**
 * Export user data for GDPR data portability
 */
export async function exportUserData(userId: string): Promise<{
  userData: any
  trips: any[]
  preferences: any
  captures: any[]
  chats: any[]
}> {
  const exportData = {
    userData: null,
    trips: [] as any[],
    preferences: null,
    captures: [] as any[],
    chats: [] as any[]
  }

  try {
    // Get user document
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)))
    if (!userDoc.empty) {
      exportData.userData = userDoc.docs[0].data()
    }

    // Get trips
    const tripsQuery = query(collection(db, 'trips'), where('userId', '==', userId))
    const tripsSnapshot = await getDocs(tripsQuery)
    exportData.trips = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get preferences
    const preferencesDoc = await getDocs(query(collection(db, 'travelPreferences'), where('__name__', '==', userId)))
    if (!preferencesDoc.empty) {
      exportData.preferences = preferencesDoc.docs[0].data()
    }

    // Get captures
    const capturesQuery = query(collection(db, 'captures'), where('userId', '==', userId))
    const capturesSnapshot = await getDocs(capturesQuery)
    exportData.captures = capturesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get chats
    const chatsQuery = query(collection(db, 'chats'), where('userId', '==', userId))
    const chatsSnapshot = await getDocs(chatsQuery)
    exportData.chats = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  } catch (error) {
    console.error('Error exporting user data:', error)
    throw error
  }

  return exportData
}