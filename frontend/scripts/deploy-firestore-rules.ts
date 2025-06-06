#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'

// Read service account
const serviceAccountPath = path.join(__dirname, '..', 'novatrek-dev-firebase-adminsdk.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

// Initialize admin
initializeApp({
  credential: cert(serviceAccount),
})

// This script can't deploy rules directly, but we can verify the Firestore connection
async function verifyFirestore() {
  try {
    const db = getFirestore()
    const testDoc = await db.collection('tripShares').doc('test').get()
    console.log('✅ Connected to Firestore successfully')
    console.log('\nTo deploy Firestore rules, you need to:')
    console.log('1. Run: firebase login')
    console.log('2. Run: firebase deploy --only firestore:rules')
    console.log('\nOr ask the project owner to deploy the rules.')
  } catch (error) {
    console.error('❌ Error connecting to Firestore:', error)
  }
}

verifyFirestore()