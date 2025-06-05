'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirebase } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Plane, 
  MapPin, 
  Sparkles,
  Check
} from "lucide-react"
import { signInWithGoogle } from "@/lib/firebase/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSubscription } from "@/hooks/use-subscription"

export default function Home() {
  const { isAuthenticated, user } = useFirebase()
  const { subscription, loading: subLoading, fetchSubscriptionStatus } = useSubscription()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !checkingSubscription && !subLoading) {
      checkSubscriptionAndRedirect()
    }
  }, [isAuthenticated, subLoading])

  const checkSubscriptionAndRedirect = async () => {
    setCheckingSubscription(true)
    
    try {
      // Fetch latest subscription status
      await fetchSubscriptionStatus()
      
      // Check subscription and redirect accordingly
      setTimeout(() => {
        if (subscription?.status === 'active') {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
        setCheckingSubscription(false)
      }, 500)
    } catch (error) {
      console.error('Error checking subscription:', error)
      // Default to onboarding on error
      router.push('/onboarding')
      setCheckingSubscription(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      // Subscription check will happen automatically via useEffect
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement email sign up
    console.log('Email sign up:', email)
  }

  return (
    <main className="flex min-h-screen">
      {/* Theme toggle - absolute positioned */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Left side - Sign in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Plane className="w-10 h-10 text-primary" />
              <span className="text-3xl font-bold">NovaTrek</span>
            </div>
            
            <h1 className="text-2xl font-semibold mb-2">
              Get started with NovaTrek
            </h1>
            <p className="text-muted-foreground">
              Try NovaTrek free
            </p>
          </div>

          {/* Social sign in buttons */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full py-6 text-base font-normal justify-start px-6 space-x-3"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="flex-1 text-left">Continue with Google</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full py-6 text-base font-normal justify-start px-6 space-x-3"
              disabled
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              <span className="flex-1 text-left">Continue with Apple ID</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full py-6 text-base font-normal justify-start px-6 space-x-3"
              disabled
            >
              <MapPin className="w-5 h-5" />
              <span className="flex-1 text-left">SSO through employer</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Email sign up form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              required
            />
            <Button 
              type="submit" 
              className="w-full py-6 text-base bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              SIGN UP
            </Button>
          </form>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <button className="text-primary hover:underline font-medium">
              Sign in
            </button>
          </p>

          {/* Legal text */}
          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{" "}
            <a href="#" className="underline">Terms of Service</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>. You also
            acknowledge that you have reviewed our{" "}
            <a href="#" className="underline">Travel Guidelines</a>.
          </p>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-12 items-center">
        <div className="max-w-xl">
          <h2 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Plan, explore, and experience your perfect journey, all on NovaTrek.
          </h2>

          {/* Phone mockup */}
          <div className="mb-12 relative">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-4 max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">$2,847</span>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
                  <div className="bg-blue-500 h-2 rounded-full w-1/2"></div>
                  <div className="bg-purple-500 h-2 rounded-full w-1/4"></div>
                </div>
                <p className="text-sm text-muted-foreground">Trip budget overview</p>
              </div>
            </div>
          </div>

          {/* Features list */}
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Access smart travel planning and budgeting tools
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Track your trips, itineraries, and travel expenses
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Get weather forecasts and activity recommendations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Chat with AI for personalized travel advice
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Share itineraries with travel companions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Get AI-powered destination insights
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Create detailed day-by-day itineraries
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}