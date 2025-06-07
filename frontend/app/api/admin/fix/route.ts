import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

const DEFAULT_PERMISSIONS = {
  super_admin: [
    { resource: 'marketplace', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'experts', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'products', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'transactions', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'applications', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'create', 'update', 'delete'] }
  ]
}

export async function POST(request: Request) {
  try {
    const { userId, email, name, role } = await request.json()
    
    if (!userId || !email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get the admin database instance
    const db = getAdminDb()
    
    if (!db) {
      return NextResponse.json({ error: 'Failed to initialize Firebase Admin' }, { status: 500 })
    }
    
    // Create or update the admin document
    await db.collection('admin_users').doc(userId).set({
      id: userId,
      userId: userId,
      email: email,
      name: name,
      role: role,
      permissions: DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true })
    
    return NextResponse.json({ 
      success: true,
      message: 'Admin document created/updated successfully'
    })
  } catch (error: any) {
    console.error('Error creating admin document:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin document',
      details: error.message 
    }, { status: 500 })
  }
}