import TravelSidebar from './TravelSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <TravelSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}