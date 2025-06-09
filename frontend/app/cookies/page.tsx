import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy - NovaTrek',
  description: 'NovaTrek cookie policy - How we use cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies</h2>
          <p className="mb-4">
            Cookies are small text files that are placed on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
          <p className="mb-4">
            We use cookies to understand how you use our service, remember your preferences, 
            and improve your experience on our platform.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Essential Cookies</h3>
          <p className="mb-4">
            These cookies are necessary for the website to function properly and cannot be 
            switched off in our systems.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Analytics Cookies</h3>
          <p className="mb-4">
            We use analytics cookies to understand how visitors interact with our website, 
            helping us improve our service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Managing Cookies</h2>
          <p className="mb-4">
            Most web browsers automatically accept cookies, but you can modify your browser 
            settings to decline cookies if you prefer.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about our use of cookies, please contact us at{' '}
            <a href="mailto:privacy@novatrek.app" className="text-primary hover:underline">
              privacy@novatrek.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}