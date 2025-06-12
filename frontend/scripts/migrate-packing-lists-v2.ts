#!/usr/bin/env tsx

/**
 * Migration script: Packing Lists V1 -> V2
 * 
 * Migrates packing lists from the old structure to the new V2 subcollection structure
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { PackingListV2, PackingItemV2 } from '../types/travel-v2'

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
)

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

interface OldPackingList {
  id?: string
  tripId: string
  userId: string
  categories: {
    [key: string]: {
      name: string
      items: Array<{
        id: string
        name: string
        quantity: number
        packed: boolean
        shared?: boolean
        addedBy?: string
      }>
    }
  }
  sharedWith?: string[]
  createdAt: any
  updatedAt: any
}

async function migratePackingLists() {
  console.log('Starting packing list migration...')
  
  try {
    // Get all old packing lists
    const oldListsSnapshot = await db.collection('packingLists').get()
    console.log(`Found ${oldListsSnapshot.size} packing lists to migrate`)
    
    let migrated = 0
    let failed = 0
    
    for (const doc of oldListsSnapshot.docs) {
      try {
        const oldList = { id: doc.id, ...doc.data() } as OldPackingList
        console.log(`\nMigrating packing list for trip: ${oldList.tripId}`)
        
        // Check if trip exists in V2
        const tripDoc = await db.collection('trips').doc(oldList.tripId).get()
        if (!tripDoc.exists) {
          console.log(`  ⚠️  Trip ${oldList.tripId} not found, skipping...`)
          continue
        }
        
        // Convert old format to new format
        const items: PackingItemV2[] = []
        const completedItems: string[] = []
        const categoryStats: Record<string, number> = {}
        
        // Map old categories to new format
        const categoryMapping: Record<string, PackingItemV2['category']> = {
          'essentials': 'Documents',
          'clothes': 'Clothing',
          'toiletries': 'Personal Care',
          'electronics': 'Electronics',
          'health': 'Health',
          'outdoor': 'Gear',
          'shared': 'Other',
          'documents': 'Documents',
          'footwear': 'Footwear',
          'accessories': 'Accessories'
        }
        
        // Process each category
        for (const [categoryKey, categoryData] of Object.entries(oldList.categories || {})) {
          const newCategory = categoryMapping[categoryKey] || 'Other'
          
          for (const item of categoryData.items || []) {
            const newItem: PackingItemV2 = {
              id: item.id,
              name: item.name,
              category: newCategory,
              quantity: item.quantity || 1,
              customItem: true, // All migrated items are considered custom
              essential: categoryKey === 'essentials'
            }
            
            items.push(newItem)
            
            if (item.packed) {
              completedItems.push(item.id)
            }
            
            categoryStats[newCategory] = (categoryStats[newCategory] || 0) + 1
          }
        }
        
        // Create new V2 packing list
        const newPackingList: Omit<PackingListV2, 'id'> = {
          tripId: oldList.tripId,
          name: 'Migrated Packing List',
          description: 'Automatically migrated from previous version',
          isPrimary: true,
          template: 'custom',
          items,
          completedItems,
          stats: {
            totalItems: items.length,
            completedItems: completedItems.length,
            categories: categoryStats
          },
          createdAt: oldList.createdAt || new Date(),
          updatedAt: oldList.updatedAt || new Date()
        }
        
        // Save to new location (subcollection)
        const newListRef = db
          .collection('trips')
          .doc(oldList.tripId)
          .collection('packing_lists')
          .doc(oldList.id || db.collection('_').doc().id)
        
        await newListRef.set(newPackingList)
        
        console.log(`  ✅ Migrated successfully: ${items.length} items in ${Object.keys(categoryStats).length} categories`)
        migrated++
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate packing list ${doc.id}:`, error)
        failed++
      }
    }
    
    console.log('\n=== Migration Summary ===')
    console.log(`Total packing lists: ${oldListsSnapshot.size}`)
    console.log(`Successfully migrated: ${migrated}`)
    console.log(`Failed: ${failed}`)
    
    if (migrated > 0) {
      console.log('\n⚠️  Remember to:')
      console.log('1. Test the migrated packing lists in the app')
      console.log('2. Update any code still using the old PackingModel')
      console.log('3. Delete the old packingLists collection once verified')
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migratePackingLists()
  .then(() => {
    console.log('\n✅ Migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })