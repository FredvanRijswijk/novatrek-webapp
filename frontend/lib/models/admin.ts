import { db, auth } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

// Admin roles
export type AdminRole = 'super_admin' | 'marketplace_admin' | 'support_admin'

export interface AdminUser {
  id: string
  userId: string // Firebase Auth UID
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string // Admin who created this admin
}

export interface AdminPermission {
  resource: 'marketplace' | 'users' | 'experts' | 'products' | 'transactions' | 'applications' | 'settings'
  actions: ('read' | 'create' | 'update' | 'delete')[]
}

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
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

// Firestore collection
const ADMIN_COLLECTION = 'admin_users'

export class AdminModel {
  /**
   * Check if a user is an admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const docRef = doc(db, ADMIN_COLLECTION, userId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return false
      
      const data = docSnap.data() as AdminUser
      return data.isActive === true
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Get admin user by ID
   */
  static async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      const docRef = doc(db, ADMIN_COLLECTION, userId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        console.log(`No admin document found for user: ${userId}`)
        return null
      }
      
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        lastLogin: data.lastLogin?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as AdminUser
    } catch (error) {
      console.error('Error getting admin user:', error)
      return null
    }
  }

  /**
   * Create a new admin user
   */
  static async createAdminUser(
    userId: string,
    email: string,
    name: string,
    role: AdminRole,
    createdBy?: string
  ): Promise<AdminUser> {
    const docRef = doc(db, ADMIN_COLLECTION, userId)
    
    const adminUser = {
      id: userId,
      userId,
      email,
      name,
      role,
      permissions: DEFAULT_PERMISSIONS[role],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy
    }

    await setDoc(docRef, adminUser)
    
    return {
      ...adminUser,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AdminUser
  }

  /**
   * Update admin user
   */
  static async updateAdminUser(userId: string, data: Partial<AdminUser>): Promise<void> {
    const docRef = doc(db, ADMIN_COLLECTION, userId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const docRef = doc(db, ADMIN_COLLECTION, userId)
    await updateDoc(docRef, {
      lastLogin: serverTimestamp()
    })
  }

  /**
   * Deactivate an admin user
   */
  static async deactivateAdmin(userId: string): Promise<void> {
    await this.updateAdminUser(userId, { isActive: false })
  }

  /**
   * Activate an admin user
   */
  static async activateAdmin(userId: string): Promise<void> {
    await this.updateAdminUser(userId, { isActive: true })
  }

  /**
   * Get all admin users
   */
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const querySnapshot = await getDocs(collection(db, ADMIN_COLLECTION))
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          lastLogin: data.lastLogin?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as AdminUser
      })
    } catch (error) {
      console.error('Error getting all admins:', error)
      return []
    }
  }

  /**
   * Check if user has permission for a specific action
   */
  static async hasPermission(
    userId: string,
    resource: AdminPermission['resource'],
    action: AdminPermission['actions'][0]
  ): Promise<boolean> {
    const admin = await this.getAdminUser(userId)
    if (!admin || !admin.isActive) return false

    const permission = admin.permissions.find(p => p.resource === resource)
    return permission ? permission.actions.includes(action) : false
  }

  /**
   * Get admin role display name
   */
  static getRoleDisplayName(role: AdminRole): string {
    const roleNames: Record<AdminRole, string> = {
      super_admin: 'Super Admin',
      marketplace_admin: 'Marketplace Admin',
      support_admin: 'Support Admin'
    }
    return roleNames[role] || role
  }

  /**
   * Get admin role description
   */
  static getRoleDescription(role: AdminRole): string {
    const descriptions: Record<AdminRole, string> = {
      super_admin: 'Full access to all system features and settings',
      marketplace_admin: 'Manage marketplace, experts, products, and applications',
      support_admin: 'Read-only access for customer support'
    }
    return descriptions[role] || ''
  }
}