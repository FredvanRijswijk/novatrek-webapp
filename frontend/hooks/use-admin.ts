import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { AdminModel, AdminUser, AdminRole, AdminPermission } from '@/lib/models/admin'

interface UseAdminReturn {
  isAdmin: boolean
  adminUser: AdminUser | null
  loading: boolean
  role: AdminRole | null
  hasPermission: (resource: AdminPermission['resource'], action: AdminPermission['actions'][0]) => boolean
  refreshAdminStatus: () => Promise<void>
}

export function useAdmin(): UseAdminReturn {
  const { user, isAuthenticated } = useFirebase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false)
      setAdminUser(null)
      setLoading(false)
      return
    }

    try {
      // First, check if the user has admin custom claims
      const idTokenResult = await user.getIdTokenResult()
      const hasAdminClaim = idTokenResult.claims.admin === true
      const adminRole = idTokenResult.claims.role as AdminRole
      
      if (hasAdminClaim && adminRole) {
        // User has admin claims, try to get the full admin document
        try {
          const admin = await AdminModel.getAdminUser(user.uid)
          if (admin && admin.isActive) {
            setIsAdmin(true)
            setAdminUser(admin)
            // Update last login - ignore errors as this is non-critical
            AdminModel.updateLastLogin(user.uid).catch(() => {
              // Silently ignore - user already has access
            })
          } else {
            // Admin document doesn't exist or is inactive, but user has claims
            // Create a temporary admin user object from claims
            setIsAdmin(true)
            setAdminUser({
              id: user.uid,
              userId: user.uid,
              email: user.email || '',
              name: idTokenResult.claims.name as string || user.displayName || 'Admin',
              role: adminRole,
              permissions: getDefaultPermissions(adminRole),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        } catch (firestoreError: any) {
          // If we can't read from Firestore but have valid claims, still allow access
          if (firestoreError.code === 'permission-denied') {
            // Silently use claims-based access without console warnings
            setIsAdmin(true)
            setAdminUser({
              id: user.uid,
              userId: user.uid,
              email: user.email || '',
              name: idTokenResult.claims.name as string || user.displayName || 'Admin',
              role: adminRole,
              permissions: getDefaultPermissions(adminRole),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          } else {
            throw firestoreError
          }
        }
      } else {
        // No admin claims
        setIsAdmin(false)
        setAdminUser(null)
      }
    } catch (error: any) {
      console.error('Error checking admin status:', error)
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        userId: user?.uid
      })
      setIsAdmin(false)
      setAdminUser(null)
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to get default permissions by role
  const getDefaultPermissions = (role: AdminRole): AdminPermission[] => {
    const permissions: Record<AdminRole, AdminPermission[]> = {
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
    return permissions[role] || []
  }

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  const hasPermission = (resource: AdminPermission['resource'], action: AdminPermission['actions'][0]): boolean => {
    if (!adminUser || !adminUser.isActive) return false
    
    const permission = adminUser.permissions.find(p => p.resource === resource)
    return permission ? permission.actions.includes(action) : false
  }

  return {
    isAdmin,
    adminUser,
    loading,
    role: adminUser?.role || null,
    hasPermission,
    refreshAdminStatus: checkAdminStatus
  }
}