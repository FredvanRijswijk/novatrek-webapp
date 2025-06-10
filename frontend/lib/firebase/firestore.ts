import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore'
import { db } from './config'

// Generic Document Operations
export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<DocumentReference<DocumentData>> => {
  if (docId) {
    const docRef = doc(db, collectionName, docId)
    await setDoc(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return docRef
  } else {
    const colRef = collection(db, collectionName)
    return await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
}

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  
  return null
}

export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  const docRef = doc(db, collectionName, docId)
  // Use setDoc with merge:true to handle cases where document might not exist
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, collectionName, docId)
  await deleteDoc(docRef)
}

// Collection Operations
export const getCollection = async <T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  const colRef = collection(db, collectionName)
  const q = query(colRef, ...constraints)
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[]
}

// Real-time Listeners
export const subscribeToDocument = <T extends DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe => {
  const docRef = doc(db, collectionName, docId)
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T)
    } else {
      callback(null)
    }
  })
}

export const subscribeToCollection = <T extends DocumentData>(
  collectionName: string,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe => {
  const colRef = collection(db, collectionName)
  const q = query(colRef, ...constraints)
  
  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[]
    callback(docs)
  })
}

// Query Helpers
export const createQuery = (
  collectionName: string,
  ...constraints: QueryConstraint[]
) => {
  const colRef = collection(db, collectionName)
  return query(colRef, ...constraints)
}

// Pagination Helper
export const getPaginatedCollection = async <T extends DocumentData>(
  collectionName: string,
  pageSize: number = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ...constraints: QueryConstraint[]
): Promise<{ docs: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const colRef = collection(db, collectionName)
  const baseConstraints = [...constraints, limit(pageSize)]
  
  if (lastDoc) {
    baseConstraints.push(startAfter(lastDoc))
  }
  
  const q = query(colRef, ...baseConstraints)
  const querySnapshot = await getDocs(q)
  
  const docs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[]
  
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null
  
  return { docs, lastDoc: lastVisible }
}

// User-specific Document Operations
export const createUserDocument = async <T extends DocumentData>(
  userId: string,
  data: T
): Promise<DocumentReference<DocumentData>> => {
  return createDocument('users', data, userId)
}

export const getUserDocument = async <T extends DocumentData>(
  userId: string
): Promise<T | null> => {
  return getDocument<T>('users', userId)
}

export const updateUserDocument = async <T extends Partial<DocumentData>>(
  userId: string,
  data: T
): Promise<void> => {
  return updateDocument('users', userId, data)
}

// Utility Functions
export const getTimestamp = () => serverTimestamp()

export const formatTimestamp = (timestamp: Timestamp): string => {
  return timestamp.toDate().toLocaleDateString()
}

export const formatDateTime = (timestamp: Timestamp): string => {
  return timestamp.toDate().toLocaleString()
}

// Export query constraint helpers for convenience
export {
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
}

// Export db for direct usage when needed
export { db }