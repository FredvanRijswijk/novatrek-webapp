import { Button } from "@/components/ui/button"
import AuthButton from "@/components/auth/AuthButton"
import UserProfile from "@/components/auth/UserProfile"
import FirestoreTest from "@/components/auth/FirestoreTest"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="z-10 w-full max-w-6xl">
        <h1 className="text-6xl font-bold text-center mb-8">
          Next.js 15 + Tailwind CSS v4 + Firebase
        </h1>
        
        <div className="flex flex-col items-center gap-6 mt-8">
          <p className="text-center text-muted-foreground mb-4">
            Your stack is ready! This setup includes:
          </p>
          
          <ul className="list-disc list-inside text-left space-y-2 mb-8">
            <li>Next.js 15 with App Router</li>
            <li>TypeScript for type safety</li>
            <li>Tailwind CSS v4 (beta)</li>
            <li>shadcn/ui components</li>
            <li>React 19 compatibility</li>
            <li>Firebase Authentication</li>
            <li>Firestore Database</li>
          </ul>
          
          {/* Firebase Authentication Demo */}
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-semibold text-center mb-6">
              🔐 Firebase Authentication Demo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Auth Button */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Authentication
                </h3>
                <AuthButton />
              </div>
              
              {/* User Profile */}
              <div className="md:col-span-1">
                <UserProfile />
              </div>
              
              {/* Firestore Test */}
              <div className="md:col-span-1">
                <FirestoreTest />
              </div>
            </div>
          </div>
          
          {/* UI Components Demo */}
          <div className="w-full max-w-4xl mt-12">
            <h2 className="text-2xl font-semibold text-center mb-6">
              🎨 shadcn/ui Components Demo
            </h2>
            
            <div className="flex gap-4 flex-wrap justify-center mb-4">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}