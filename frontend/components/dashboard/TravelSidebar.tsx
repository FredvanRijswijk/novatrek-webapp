'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFirebase, signOutUser } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { 
  Plane, 
  Home, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Settings, 
  User, 
  PlusCircle,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Trips', href: '/dashboard/trips', icon: MapPin },
  { name: 'AI Assistant', href: '/chat', icon: MessageCircle },
  { name: 'Itineraries', href: '/dashboard/itineraries', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const quickActions = [
  { name: 'Plan New Trip', href: '/dashboard/trips/new', icon: PlusCircle },
  { name: 'Saved Places', href: '/dashboard/saved', icon: MapPin },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

export default function TravelSidebar({ className }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated } = useFirebase()

  const handleSignOut = async () => {
    try {
      await signOutUser()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={cn("w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800", className)}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <Plane className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">NovaTrek</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Please sign in to access your travel dashboard</p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <Plane className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">NovaTrek</span>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.displayName || 'Traveler'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            <div className="mb-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Navigation
              </h3>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" 
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Actions
              </h3>
              {quickActions.map((item) => {
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}