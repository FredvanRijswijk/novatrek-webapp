'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { User, Shield, CreditCard } from 'lucide-react'

const settingsTabs = [
  {
    title: 'Profile',
    href: '/dashboard/settings/profile',
    icon: User,
    description: 'Manage your public profile and personal information'
  },
  {
    title: 'Account',
    href: '/dashboard/settings/account',
    icon: Shield,
    description: 'Security settings and account management'
  },
  {
    title: 'Billing',
    href: '/dashboard/settings/billing',
    icon: CreditCard,
    description: 'Subscription and payment methods'
  }
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.href
              
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.title}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
        
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
}