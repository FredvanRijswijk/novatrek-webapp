import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - NovaTrek',
  description: 'NovaTrek terms of service - Rules and guidelines for using our platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using NovaTrek, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use of Service</h2>
          <p className="mb-4">
            You may use our service for lawful purposes only. You agree not to use NovaTrek 
            in any way that violates any applicable federal, state, local, or international law.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account and password. 
            You agree to accept responsibility for all activities that occur under your account.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Intellectual Property</h2>
          <p className="mb-4">
            The service and its original content, features, and functionality are owned by NovaTrek 
            and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account and bar access to the service immediately, 
            without prior notice or liability, under our sole discretion, for any reason whatsoever.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@novatrek.app" className="text-primary hover:underline">
              legal@novatrek.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}