'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFirebase } from "@/lib/firebase"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { 
  Plane, 
  MapPin, 
  Sparkles,
  Check,
  Store,
  Users,
  Star,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react"
import { signInWithGoogle, signUpWithEmail, getAuthErrorMessage } from "@/lib/firebase/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"

function SignUpContent() {
  const { isAuthenticated } = useFirebase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      // Redirect will happen automatically via useEffect
    } catch (error: any) {
      setError(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }
    
    try {
      await signUpWithEmail(email, password)
      // Redirect will happen automatically via useEffect
    } catch (error: any) {
      setError(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Theme toggle - absolute positioned */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Left side - Sign up form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Plane className="w-10 h-10 text-primary" />
              <span className="text-3xl font-bold">NovaTrek</span>
            </div>
            
            <h1 className="text-2xl font-semibold mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Start planning your perfect trips
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Social sign up buttons */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full py-6 text-base font-normal justify-start px-6 space-x-3"
              onClick={handleGoogleSignUp}
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 text-base bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "CREATE ACCOUNT"}
            </Button>
          </form>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {/* Legal text */}
          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>. You also
            acknowledge that you have reviewed our{" "}
            <Link href="/guidelines" className="underline">Travel Guidelines</Link>.
          </p>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-12 items-center">
        <div className="max-w-xl">
          <h2 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Join thousands planning smarter trips with AI
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Active users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">50K+</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Trips planned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">4.9★</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">User rating</div>
            </div>
          </div>

          {/* Features list */}
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                AI-powered itinerary generation with GPT-4 & Gemini
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Save travel inspiration with our browser extension
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Connect with verified travel experts in our marketplace
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Track budgets and split expenses with travel companions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Get real-time weather updates and recommendations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="rounded-full bg-gray-900 dark:bg-white p-1 mt-0.5">
                <Check className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-gray-900 dark:text-white">
                Share trips and collaborate with friends & family
              </span>
            </li>
          </ul>
          
          {/* Testimonial */}
          <div className="mt-12 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur">
            <div className="flex items-start gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-900 dark:text-white mb-3 italic">
              "NovaTrek transformed how I plan trips. The AI suggestions are spot-on, 
              and the Travel Inbox keeps all my inspiration organized. Can't imagine 
              traveling without it!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Sarah Chen</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Digital Nomad</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  )
}