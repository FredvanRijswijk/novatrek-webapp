export default function MinimalDashboard() {
  return (
    <div className="flex h-screen">
      {/* Simple Sidebar */}
      <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r p-4">
        <h2 className="font-bold mb-4">NovaTrek</h2>
        <nav className="space-y-2">
          <div className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Dashboard</div>
          <div className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">My Trips</div>
          <div className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">AI Assistant</div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </header>
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-4">Welcome to NovaTrek!</h1>
          <p className="text-gray-600 mb-8">Your AI-powered travel planning assistant</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Plan New Trip</h3>
              <p className="text-sm text-gray-600">Start planning your next adventure</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
              <h3 className="font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600">Get personalized recommendations</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
              <h3 className="font-semibold mb-2">View Itineraries</h3>
              <p className="text-sm text-gray-600">Manage your trip schedules</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}