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
import { PackingList, PackingTemplate, PackingCategory, PackingItem } from '@/types/travel'
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers'

export class PackingModel {
  static readonly COLLECTION = 'packing_lists'
  static readonly TEMPLATES_COLLECTION = 'packing_templates'

  // Create a new packing list
  static async create(packingData: Omit<PackingList, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const cleanedData = cleanFirestoreData({
      ...packingData,
      lastUpdated: new Date(),
      createdAt: new Date()
    })
    const docRef = await createDocument(this.COLLECTION, cleanedData)
    return docRef.id
  }

  // Get a packing list by ID
  static async getById(packingListId: string): Promise<PackingList | null> {
    const packingList = await getDocument<PackingList>(this.COLLECTION, packingListId)
    return packingList ? convertTimestampsToDates(packingList) : null
  }

  // Get packing list by trip ID
  static async getByTripId(tripId: string): Promise<PackingList | null> {
    const packingLists = await getCollection<PackingList>(
      this.COLLECTION,
      where('tripId', '==', tripId)
    )
    return packingLists.length > 0 ? convertTimestampsToDates(packingLists[0]) : null
  }

  // Get all packing lists for a user
  static async getUserPackingLists(userId: string): Promise<PackingList[]> {
    const packingLists = await getCollection<PackingList>(
      this.COLLECTION,
      where('userId', '==', userId),
      orderBy('lastUpdated', 'desc')
    )
    return packingLists.map(list => convertTimestampsToDates(list))
  }

  // Update packing list
  static async update(packingListId: string, updates: Partial<PackingList>): Promise<void> {
    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      lastUpdated: new Date()
    })
    await updateDocument(this.COLLECTION, packingListId, cleanedUpdates)
  }

  // Delete packing list
  static async delete(packingListId: string): Promise<void> {
    await deleteDocument(this.COLLECTION, packingListId)
  }

  // Subscribe to packing list changes
  static subscribeToPackingList(packingListId: string, callback: (packingList: PackingList | null) => void) {
    return subscribeToDocument<PackingList>(this.COLLECTION, packingListId, (packingList) => {
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
      id: Math.random().toString(36).substring(2, 9),
      categoryId,
      checked: false
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

    packingList.categories[categoryIndex].items = packingList.categories[categoryIndex].items.filter(
      item => item.id !== itemId
    )

    await this.update(packingListId, { categories: packingList.categories })
  }

  // Update item quantity
  static async updateItemQuantity(
    packingListId: string, 
    categoryId: string, 
    itemId: string, 
    quantity: number
  ): Promise<void> {
    const packingList = await this.getById(packingListId)
    if (!packingList) throw new Error('Packing list not found')

    const categoryIndex = packingList.categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) throw new Error('Category not found')

    const itemIndex = packingList.categories[categoryIndex].items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) throw new Error('Item not found')

    packingList.categories[categoryIndex].items[itemIndex].quantity = quantity
    await this.update(packingListId, { categories: packingList.categories })
  }

  // Add new category
  static async addCategory(packingListId: string, categoryName: string): Promise<void> {
    const packingList = await this.getById(packingListId)
    if (!packingList) throw new Error('Packing list not found')

    const newCategory: PackingCategory = {
      id: categoryName.toLowerCase().replace(/\s+/g, '-'),
      name: categoryName,
      order: packingList.categories.length + 1,
      items: []
    }

    packingList.categories.push(newCategory)
    await this.update(packingListId, { categories: packingList.categories })
  }

  // Get packing progress
  static getProgress(packingList: PackingList): number {
    const totalItems = packingList.categories.reduce((sum, cat) => sum + cat.items.length, 0)
    if (totalItems === 0) return 0

    const checkedItems = packingList.categories.reduce(
      (sum, cat) => sum + cat.items.filter(item => item.checked).length,
      0
    )

    return Math.round((checkedItems / totalItems) * 100)
  }

  // Get category progress
  static getCategoryProgress(category: PackingCategory): { checked: number; total: number; percentage: number } {
    const total = category.items.length
    const checked = category.items.filter(item => item.checked).length
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0

    return { checked, total, percentage }
  }

  // Create packing list from template
  static async createFromTemplate(
    tripId: string,
    userId: string,
    templateId: string,
    customizations?: {
      weatherConsiderations?: PackingList['weatherConsiderations']
      tripType?: PackingList['tripType']
      additionalItems?: PackingItem[]
    }
  ): Promise<string> {
    const template = await getDocument<PackingTemplate>(this.TEMPLATES_COLLECTION, templateId)
    if (!template) throw new Error('Template not found')

    const packingListData: Omit<PackingList, 'id' | 'createdAt' | 'lastUpdated'> = {
      tripId,
      userId,
      name: `Packing list - ${template.name}`,
      categories: template.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({ ...item, checked: false }))
      })),
      templateId,
      weatherConsiderations: customizations?.weatherConsiderations,
      tripType: customizations?.tripType || template.tripType
    }

    // Add any additional custom items
    if (customizations?.additionalItems) {
      customizations.additionalItems.forEach(item => {
        const categoryIndex = packingListData.categories.findIndex(cat => cat.id === item.categoryId)
        if (categoryIndex >= 0) {
          packingListData.categories[categoryIndex].items.push(item)
        }
      })
    }

    return this.create(packingListData)
  }
}