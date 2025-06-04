'use client'

import { Button } from "@/components/ui/button"
import { useFirebase } from "@/lib/firebase"
import Link from "next/link"
import AuthButton from "@/components/auth/AuthButton"
import { MapPin, MessageCircle, Calendar, Plane, Sparkles } from "lucide-react"

export default function Home() {
  const { isAuthenticated } = useFirebase()

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center p-8 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <div className="z-10 w-full max-w-6xl text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Plane className="w-12 h-12 text-primary" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              NovaTrek
            </h1>
          </div>
          
          <p className="text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Personalized travel experiences tailored to your preferences with our advanced AI technology
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <AuthButton />
            )}
            
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur border rounded-lg p-6">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">AI Travel Assistant</h3>
              <p className="text-muted-foreground">
                Chat with our AI to get personalized recommendations for destinations, activities, and accommodations.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur border rounded-lg p-6">
              <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Day-by-Day Planning</h3>
              <p className="text-muted-foreground">
                Create detailed itineraries with activities, restaurants, and attractions planned for each day.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur border rounded-lg p-6">
              <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Weather Integration</h3>
              <p className="text-muted-foreground">
                Get real-time weather forecasts for your destinations to help plan the perfect activities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section - Only show if not authenticated */}
      {!isAuthenticated && (
        <div className="py-16 px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              See NovaTrek in Action
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Authentication Demo */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  🔐 Quick Sign In
                </h3>
                <div className="flex justify-center">
                  <AuthButton />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Sign in with Google to start planning your adventures
                </p>
              </div>
              
              {/* Features Preview */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  ✨ What&apos;s Included
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <span>AI-powered travel recommendations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span>Smart itinerary planning</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <span>Weather-aware suggestions</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-orange-600" />
                    <span>Multi-trip management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-muted-foreground">
            Built with Next.js 15, Firebase, and AI technology
          </p>
        </div>
      </footer>
    </main>
  )
}