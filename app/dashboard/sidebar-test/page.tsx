'use client'

export default function SidebarTestPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Sidebar Test Page</h1>
      <p className="text-muted-foreground">
        This page is for testing the sidebar layout. The sidebar should be visible on the left side.
      </p>
      
      <div className="grid gap-4">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Layout Test</h2>
          <p>If the sidebar is working correctly, you should see:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>A sidebar on the left with the NovaTrek logo</li>
            <li>Navigation items in the sidebar</li>
            <li>This content area properly positioned next to the sidebar</li>
            <li>A toggle button in the header to show/hide the sidebar</li>
          </ul>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Responsive Test</h2>
          <p>Try resizing your browser window:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>On mobile: Sidebar should be hidden, accessible via hamburger menu</li>
            <li>On desktop: Sidebar should be visible by default</li>
            <li>The sidebar toggle should work on all screen sizes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}