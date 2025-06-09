#!/usr/bin/env node
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = require('../../novatrek-dev-firebase-adminsdk.json')
    
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    })
  }
  
  return getApp()
}

const app = initializeFirebaseAdmin()
const db = getFirestore(app)

interface MigrationOptions {
  dryRun?: boolean
  batchSize?: number
  collections?: string[]
}

class ReferenceFieldMigrator {
  private db = db
  private stats = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    total: 0
  }

  async migrateProductExpertReferences(options: MigrationOptions = {}) {
    const { dryRun = false, batchSize = 500 } = options
    
    console.log('Starting product → expert reference migration...')
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
    console.log(`Batch size: ${batchSize}`)
    console.log('')

    try {
      // Get all products
      const productsSnapshot = await this.db.collection('marketplace_products').get()
      this.stats.total = productsSnapshot.size
      console.log(`Found ${this.stats.total} products to process`)

      const products = productsSnapshot.docs
      
      // Process in batches
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = this.db.batch()
        const batchProducts = products.slice(i, i + batchSize)
        let batchUpdates = 0

        for (const productDoc of batchProducts) {
          const product = productDoc.data()
          
          // Skip if already has reference
          if (product.expertRef) {
            this.stats.skipped++
            console.log(`✓ Skipped ${productDoc.id} - already has expertRef`)
            continue
          }

          // Migrate if has string ID
          if (product.expertId) {
            try {
              // Create reference to expert document
              const expertRef = this.db.collection('marketplace_experts').doc(product.expertId)
              
              // Verify expert exists
              const expertSnapshot = await expertRef.get()
              if (expertSnapshot.exists()) {
                if (!dryRun) {
                  batch.update(productDoc.ref, {
                    expertRef: expertRef,
                    updatedAt: FieldValue.serverTimestamp()
                  })
                  batchUpdates++
                }
                this.stats.migrated++
                console.log(`✓ Migrated ${productDoc.id} → expert ${product.expertId}`)
              } else {
                this.stats.failed++
                console.error(`✗ Failed ${productDoc.id} - expert ${product.expertId} not found`)
              }
            } catch (error) {
              this.stats.failed++
              console.error(`✗ Failed ${productDoc.id} - ${error.message}`)
            }
          } else {
            this.stats.skipped++
            console.log(`✓ Skipped ${productDoc.id} - no expertId`)
          }
        }

        // Commit batch
        if (batchUpdates > 0 && !dryRun) {
          await batch.commit()
          console.log(`Committed batch of ${batchUpdates} updates`)
        }

        // Progress update
        const processed = Math.min(i + batchSize, products.length)
        console.log(`\nProgress: ${processed}/${this.stats.total} (${Math.round(processed/this.stats.total * 100)}%)\n`)
      }

      // Final report
      console.log('\n=== Migration Summary ===')
      console.log(`Total products: ${this.stats.total}`)
      console.log(`Migrated: ${this.stats.migrated}`)
      console.log(`Skipped: ${this.stats.skipped}`)
      console.log(`Failed: ${this.stats.failed}`)
      console.log(`Success rate: ${Math.round((this.stats.migrated / (this.stats.migrated + this.stats.failed)) * 100)}%`)

    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  async migrateTransactionReferences(options: MigrationOptions = {}) {
    const { dryRun = false, batchSize = 500 } = options
    
    console.log('\nStarting transaction reference migration...')
    const stats = { migrated: 0, skipped: 0, failed: 0, total: 0 }

    try {
      const transactionsSnapshot = await this.db.collection('marketplace_transactions').get()
      stats.total = transactionsSnapshot.size
      console.log(`Found ${stats.total} transactions to process`)

      const transactions = transactionsSnapshot.docs

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = this.db.batch()
        const batchTransactions = transactions.slice(i, i + batchSize)
        let batchUpdates = 0

        for (const transactionDoc of batchTransactions) {
          const transaction = transactionDoc.data()
          const updates: any = {}

          // Check what needs migration
          if (!transaction.productRef && transaction.productId) {
            updates.productRef = this.db.collection('marketplace_products').doc(transaction.productId)
          }

          if (!transaction.buyerRef && transaction.buyerId) {
            updates.buyerRef = this.db.collection('users').doc(transaction.buyerId)
          }

          if (!transaction.sellerRef && transaction.sellerId) {
            updates.sellerRef = this.db.collection('marketplace_experts').doc(transaction.sellerId)
          }

          // Apply updates if needed
          if (Object.keys(updates).length > 0) {
            if (!dryRun) {
              updates.updatedAt = FieldValue.serverTimestamp()
              batch.update(transactionDoc.ref, updates)
              batchUpdates++
            }
            stats.migrated++
            console.log(`✓ Migrated transaction ${transactionDoc.id}`)
          } else {
            stats.skipped++
          }
        }

        if (batchUpdates > 0 && !dryRun) {
          await batch.commit()
        }
      }

      console.log(`\nTransaction migration: ${stats.migrated} migrated, ${stats.skipped} skipped`)

    } catch (error) {
      console.error('Transaction migration failed:', error)
    }
  }

  async verifyMigration() {
    console.log('\n=== Verifying Migration ===')
    
    // Check products with both fields
    const productsWithBoth = await this.db.collection('marketplace_products')
      .where('expertId', '!=', null)
      .get()
    
    let withRef = 0
    let withoutRef = 0
    
    productsWithBoth.forEach(doc => {
      const data = doc.data()
      if (data.expertRef) {
        withRef++
      } else {
        withoutRef++
      }
    })
    
    console.log(`Products with expertId: ${productsWithBoth.size}`)
    console.log(`  - With expertRef: ${withRef}`)
    console.log(`  - Without expertRef: ${withoutRef}`)
    
    // Sample check - verify references are valid
    console.log('\nChecking reference validity (sample of 10)...')
    const sampleProducts = await this.db.collection('marketplace_products')
      .where('expertRef', '!=', null)
      .limit(10)
      .get()
    
    for (const doc of sampleProducts.docs) {
      const product = doc.data()
      try {
        const expertSnapshot = await product.expertRef.get()
        if (expertSnapshot.exists()) {
          console.log(`✓ ${doc.id} → valid expert reference`)
        } else {
          console.log(`✗ ${doc.id} → invalid expert reference`)
        }
      } catch (error) {
        console.log(`✗ ${doc.id} → error checking reference: ${error.message}`)
      }
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verify = args.includes('--verify')
  const transactionsOnly = args.includes('--transactions')
  const productsOnly = args.includes('--products')
  
  const migrator = new ReferenceFieldMigrator()

  try {
    if (verify) {
      await migrator.verifyMigration()
    } else {
      if (!transactionsOnly) {
        await migrator.migrateProductExpertReferences({ dryRun })
      }
      
      if (!productsOnly) {
        await migrator.migrateTransactionReferences({ dryRun })
      }
    }
    
    console.log('\nMigration complete!')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Show usage if --help
if (process.argv.includes('--help')) {
  console.log(`
Usage: npm run migrate:references [options]

Options:
  --dry-run        Run migration in dry-run mode (no changes)
  --verify         Verify migration status
  --products       Migrate only products
  --transactions   Migrate only transactions
  --help          Show this help message

Examples:
  npm run migrate:references --dry-run    # Test migration without changes
  npm run migrate:references              # Run full migration
  npm run migrate:references --verify     # Check migration status
  `)
  process.exit(0)
}

main()