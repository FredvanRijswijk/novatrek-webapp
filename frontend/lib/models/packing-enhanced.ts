import { 
  doc,
  DocumentReference,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  createDocument, 
  updateDocument, 
  getDocument, 
  getCollection, 
  deleteDocument,
  subscribeToDocument,
  where,
  orderBy
} from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { PackingList, PackingTemplate, PackingCategory, PackingItem } from '@/types/travel'
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers'
import { User } from './user'
import { Trip } from '@/types/travel'

// Enhanced types with reference fields
export interface PackingListEnhanced extends PackingList {
  userRef?: DocumentReference<User>
  tripRef?: DocumentReference<Trip>
}

export class PackingModelEnhanced {
  static readonly COLLECTION = 'packing_lists'
  static readonly TEMPLATES_COLLECTION = 'packing_templates'
  private static db = db

  // Create a new packing list with references
  static async create(packingData: Omit<PackingList, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const enhancedData: any = {
      ...packingData,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    }

    // Add references alongside string IDs
    if (packingData.userId) {
      enhancedData.userRef = doc(this.db, 'users', packingData.userId)
    }
    if (packingData.tripId) {
      enhancedData.tripRef = doc(this.db, 'trips', packingData.tripId)
    }

    const cleanedData = cleanFirestoreData(enhancedData)
    const docRef = await createDocument(this.COLLECTION, cleanedData)
    return docRef.id
  }

  // Get a packing list by ID
  static async getById(packingListId: string): Promise<PackingListEnhanced | null> {
    const packingList = await getDocument<PackingListEnhanced>(this.COLLECTION, packingListId)
    return packingList ? convertTimestampsToDates(packingList) : null
  }

  // Get packing list by trip ID - uses references only
  static async getByTripId(tripId: string): Promise<PackingListEnhanced | null> {
    const tripRef = doc(this.db, 'trips', tripId)
    
    const lists = await getCollection<PackingListEnhanced>(
      this.COLLECTION,
      where('tripRef', '==', tripRef)
    )

    return lists.length > 0 ? convertTimestampsToDates(lists[0]) : null
  }

  // Get all packing lists for a user - uses references only
  static async getUserPackingLists(userId: string): Promise<PackingListEnhanced[]> {
    const userRef = doc(this.db, 'users', userId)
    
    const lists = await getCollection<PackingListEnhanced>(
      this.COLLECTION,
      where('userRef', '==', userRef),
      orderBy('lastUpdated', 'desc')
    )

    return lists.map(list => convertTimestampsToDates(list))
  }

  // Update packing list - optionally update references if userId changes
  static async update(packingListId: string, updates: Partial<PackingList>): Promise<void> {
    let enhancedUpdates: any = {
      ...updates,
      lastUpdated: serverTimestamp()
    }

    // If userId is being updated, also update userRef
    if (updates.userId && !updates.hasOwnProperty('userRef')) {
      enhancedUpdates.userRef = doc(this.db, 'users', updates.userId)
    }
    
    // If tripId is being updated, also update tripRef
    if (updates.tripId && !updates.hasOwnProperty('tripRef')) {
      enhancedUpdates.tripRef = doc(this.db, 'trips', updates.tripId)
    }

    const cleanedUpdates = cleanFirestoreData(enhancedUpdates)
    await updateDocument(this.COLLECTION, packingListId, cleanedUpdates)
  }

  // Delete packing list
  static async delete(packingListId: string): Promise<void> {
    await deleteDocument(this.COLLECTION, packingListId)
  }

  // Subscribe to packing list changes
  static subscribeToPackingList(packingListId: string, callback: (packingList: PackingListEnhanced | null) => void) {
    return subscribeToDocument<PackingListEnhanced>(this.COLLECTION, packingListId, (packingList) => {
      callback(packingList ? convertTimestampsToDates(packingList) : null)
    })
  }

  // Toggle item checked status
  static async toggleItemChecked(packingListId: string, categoryId: string, itemId: string): Promise<void> {
    const packingList = await this.getById(packingListId)
    if (!packingList) throw new Error('Packing list not found')

    const categoryIndex = packingList.categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) throw new Error('Category not found')

    const itemIndex = packingList.categories[categoryIndex].items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) throw new Error('Item not found')

    packingList.categories[categoryIndex].items[itemIndex].checked = 
      !packingList.categories[categoryIndex].items[itemIndex].checked

    await this.update(packingListId, { categories: packingList.categories })
  }

  // Add item to category
  static async addItem(
    packingListId: string, 
    categoryId: string, 
    item: Omit<PackingItem, 'id' | 'categoryId'>
  ): Promise<void> {
    const packingList = await this.getById(packingListId)
    if (!packingList) throw new Error('Packing list not found')

    const categoryIndex = packingList.categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) throw new Error('Category not found')

    const newItem: PackingItem = {
      ...item,
      id: `item-${Date.now()}`,
      categoryId
    }

    packingList.categories[categoryIndex].items.push(newItem)
    await this.update(packingListId, { categories: packingList.categories })
  }

  // Remove item from category
  static async removeItem(packingListId: string, categoryId: string, itemId: string): Promise<void> {
    const packingList = await this.getById(packingListId)
    if (!packingList) throw new Error('Packing list not found')

    const categoryIndex = packingList.categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) throw new Error('Category not found')

    packingList.categories[categoryIndex].items = 
      packingList.categories[categoryIndex].items.filter(item => item.id !== itemId)

    await this.update(packingListId, { categories: packingList.categories })
  }

  // Update an item in a category
  static async updateItem(
    packingListId: string, 
    categoryId: string, 
    itemId: string, 
    updates: Partial<PackingItem>
  ): Promise<void> {
    const packingList = await this.getById(packingListId)
    if (!packingList) throw new Error('Packing list not found')

    const categoryIndex = packingList.categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) throw new Error('Category not found')

    const itemIndex = packingList.categories[categoryIndex].items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) throw new Error('Item not found')

    packingList.categories[categoryIndex].items[itemIndex] = {
      ...packingList.categories[categoryIndex].items[itemIndex],
      ...updates
    }

    await this.update(packingListId, { categories: packingList.categories })
  }

  // Calculate category progress
  static getCategoryProgress(category: PackingCategory): { 
    total: number
    checked: number
    percentage: number 
  } {
    const total = category.items.length
    const checked = category.items.filter(item => item.checked).length
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0

    return { total, checked, percentage }
  }

  // Calculate overall progress
  static getProgress(packingList: PackingList): number {
    const totalItems = packingList.categories.reduce(
      (sum, cat) => sum + cat.items.length, 
      0
    )
    const checkedItems = packingList.categories.reduce(
      (sum, cat) => sum + cat.items.filter(item => item.checked).length, 
      0
    )

    return totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
  }

  // Get packing templates
  static async getTemplates(tripType?: string): Promise<PackingTemplate[]> {
    let query = this.TEMPLATES_COLLECTION
    if (tripType) {
      const templates = await getCollection<PackingTemplate>(
        query,
        where('tripTypes', 'array-contains', tripType)
      )
      return templates
    }
    return getCollection<PackingTemplate>(query)
  }

  // Create packing list from template
  static async createFromTemplate(
    templateId: string, 
    tripId: string, 
    userId: string, 
    customizations?: Partial<PackingList>
  ): Promise<string> {
    const template = await getDocument<PackingTemplate>(this.TEMPLATES_COLLECTION, templateId)
    if (!template) throw new Error('Template not found')

    const packingData: Omit<PackingList, 'id' | 'createdAt' | 'lastUpdated'> = {
      tripId,
      userId,
      name: template.name,
      categories: template.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          checked: false
        }))
      })),
      tripType: customizations?.tripType,
      weather: customizations?.weather
    }

    return this.create(packingData)
  }
}