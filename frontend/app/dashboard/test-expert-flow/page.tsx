'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Package,
  ArrowRight,
  Info
} from 'lucide-react'
import Link from 'next/link'

export default function TestExpertFlowPage() {
  const router = useRouter()

  const steps = [
    {
      title: 'Apply to Become an Expert',
      description: 'Fill out the application form with your business details and expertise',
      icon: UserPlus,
      href: '/dashboard/become-expert',
      action: 'Start Application'
    },
    {
      title: 'Admin Review',
      description: 'Admin reviews and approves your application',
      icon: FileText,
      href: '/dashboard/admin/marketplace/applications',
      action: 'View Applications (Admin)',
      adminOnly: true
    },
    {
      title: 'Complete Stripe Onboarding',
      description: 'Connect your Stripe account to receive payments',
      icon: CreditCard,
      href: '/dashboard/expert/onboarding',
      action: 'Setup Payments'
    },
    {
      title: 'Create Your First Product',
      description: 'List a trip template or travel service',
      icon: Package,
      href: '/dashboard/expert/products/new',
      action: 'Create Product'
    },
    {
      title: 'View Your Expert Dashboard',
      description: 'Manage products, view earnings, and track sales',
      icon: CheckCircle,
      href: '/dashboard/expert',
      action: 'Go to Dashboard'
    }
  ]

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Expert Onboarding Flow</h1>
        <p className="text-muted-foreground mt-2">
          Follow these steps to test the complete expert onboarding process
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Platform Fee:</strong> NovaTrek charges a 15% platform fee (minimum $1) on all transactions.
          This fee is automatically deducted before payouts to experts.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Step {index + 1}: {step.title}
                    {step.adminOnly && (
                      <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded">
                        Admin Only
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={step.href}>
                <Button className="w-full sm:w-auto">
                  {step.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Testing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">• Use Stripe test mode for onboarding (no real bank account needed)</p>
          <p className="text-sm">• You can approve your own application as admin</p>
          <p className="text-sm">• Create test products with realistic prices to see fee calculations</p>
          <p className="text-sm">• Test the checkout flow after creating products</p>
        </CardContent>
      </Card>
    </div>
  )
}