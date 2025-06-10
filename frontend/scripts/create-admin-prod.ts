#!/usr/bin/env node

/**
 * Script to create admin users for NovaTrek PRODUCTION
 * 
 * Usage:
 * npm run create-admin:prod -- --email admin@novatrek.com --name "Admin Name" --role super_admin
 * 
 * Roles:
 * - super_admin: Full system access
 * - marketplace_admin: Marketplace management
 * - support_admin: Read-only support access
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { program } from 'commander'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Firebase Admin with PRODUCTION credentials
const serviceAccount = require('../novatrek-app-firebase-adminsdk-prod.json')

console.log('🚨 PRODUCTION ENVIRONMENT 🚨')
console.log('Initializing Firebase Admin with production credentials...')

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'novatrek-app' // Production project ID
})

const auth = getAuth()
const db = getFirestore()

// Admin roles
type AdminRole = 'super_admin' | 'marketplace_admin' | 'support_admin'

// Default permissions by role
const DEFAULT_PERMISSIONS = {
  super_admin: [
    { resource: 'marketplace', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'experts', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'products', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'transactions', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'applications', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'create', 'update', 'delete'] }
  ],
  marketplace_admin: [
    { resource: 'marketplace', actions: ['read', 'update'] },
    { resource: 'experts', actions: ['read', 'update'] },
    { resource: 'products', actions: ['read', 'update', 'delete'] },
    { resource: 'transactions', actions: ['read'] },
    { resource: 'applications', actions: ['read', 'update'] }
  ],
  support_admin: [
    { resource: 'marketplace', actions: ['read'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'experts', actions: ['read'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'transactions', actions: ['read'] },
    { resource: 'applications', actions: ['read'] }
  ]
}

async function createAdmin(email: string, name: string, role: AdminRole, password?: string) {
  try {
    console.log(`\nCreating admin user: ${email} with role: ${role}`)

    // Check if user already exists
    let user
    try {
      user = await auth.getUserByEmail(email)
      console.log('User already exists in Firebase Auth')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        console.log('Creating new Firebase Auth user...')
        user = await auth.createUser({
          email,
          displayName: name,
          password: password || generateSecurePassword(),
          emailVerified: true
        })
        console.log('Firebase Auth user created successfully')
      } else {
        throw error
      }
    }

    // Check if admin record exists
    const adminDoc = await db.collection('admin_users').doc(user.uid).get()
    
    if (adminDoc.exists) {
      console.log('Admin record already exists. Updating role...')
      await db.collection('admin_users').doc(user.uid).update({
        role,
        permissions: DEFAULT_PERMISSIONS[role],
        updatedAt: new Date()
      })
    } else {
      // Create admin record
      console.log('Creating admin record in Firestore...')
      await db.collection('admin_users').doc(user.uid).set({
        id: user.uid,
        userId: user.uid,
        email,
        name,
        role,
        permissions: DEFAULT_PERMISSIONS[role],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Set custom claims
    console.log('Setting custom claims...')
    await auth.setCustomUserClaims(user.uid, {
      admin: true,
      role: role
    })

    console.log('\n✅ Admin user created successfully in PRODUCTION!')
    console.log(`Email: ${email}`)
    console.log(`Role: ${role}`)
    console.log(`User ID: ${user.uid}`)
    
    if (!password) {
      console.log('\n⚠️  A secure password was generated. The user should reset their password using the forgot password flow.')
    }

    console.log('\n📝 Next steps:')
    console.log('1. The user can now log in with their email and password')
    console.log('2. They will have access to admin sections based on their role')
    console.log('3. To change roles, run this script again with a different role')

  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// CLI setup
program
  .requiredOption('-e, --email <email>', 'Admin email address')
  .requiredOption('-n, --name <name>', 'Admin full name')
  .requiredOption('-r, --role <role>', 'Admin role (super_admin, marketplace_admin, support_admin)')
  .option('-p, --password <password>', 'Admin password (optional, will generate if not provided)')
  .parse(process.argv)

const options = program.opts()

// Validate role
const validRoles: AdminRole[] = ['super_admin', 'marketplace_admin', 'support_admin']
if (!validRoles.includes(options.role)) {
  console.error(`Invalid role: ${options.role}`)
  console.error(`Valid roles are: ${validRoles.join(', ')}`)
  process.exit(1)
}

// Confirm production action
console.log('\n⚠️  WARNING: You are about to create an admin user in PRODUCTION!')
console.log('This action cannot be easily undone.')
console.log(`\nDetails:`)
console.log(`- Email: ${options.email}`)
console.log(`- Name: ${options.name}`)
console.log(`- Role: ${options.role}`)
console.log(`- Environment: PRODUCTION (novatrek-app)`)

// Create admin
createAdmin(options.email, options.name, options.role, options.password)
  .then(() => process.exit(0))
  .catch(() => process.exit(1))