import { TestRoute } from '@/components/auth/TestRoute'

export default function TestPage() {
  return (
    <TestRoute>
      <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Dashboard Test Page</h1>
      <p className="text-lg">This is a simple test page to check if the layout works.</p>
      <div className="mt-8 p-4 bg-blue-100 rounded">
        <p>If you can see this blue box, the layout is working correctly.</p>
      </div>
      </div>
    </TestRoute>
  )
}