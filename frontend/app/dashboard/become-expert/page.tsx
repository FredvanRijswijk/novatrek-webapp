'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { ExpertApplicationForm } from '@/components/marketplace/expert/ExpertApplicationForm'
import { MarketplaceModel } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'

export default function BecomeExpertPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [existingExpert, setExistingExpert] = useState<any>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function checkStatus() {
      if (!user) return

      try {
        // Check for existing expert profile
        const expert = await MarketplaceModel.getExpertByUserId(user.uid)
        if (expert) {
          setExistingExpert(expert)
          setLoading(false)
          return
        }

        // Check for existing application
        const application = await MarketplaceModel.getApplicationByUserId(user.uid)
        if (application) {
          setExistingApplication(application)
        }
      } catch (error) {
        console.error('Error checking expert status:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      checkStatus()
    }
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Already an expert
  if (existingExpert) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              You're Already a Travel Expert!
            </CardTitle>
            <CardDescription>
              You have an active expert account on NovaTrek
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">{existingExpert.businessName}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={existingExpert.status === 'active' ? 'default' : 'secondary'}>
                {existingExpert.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {existingExpert.specializations.map((spec: string) => (
                  <Badge key={spec} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => router.push('/dashboard/expert')}
                className="w-full"
              >
                Go to Expert Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Has pending application
  if (existingApplication) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600',
        title: 'Application Under Review',
        description: 'We\'re reviewing your application and will get back to you within 2-3 business days.'
      },
      approved: {
        icon: CheckCircle,
        color: 'text-green-600',
        title: 'Application Approved!',
        description: 'Congratulations! Your application has been approved. You can now set up your expert account.'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600',
        title: 'Application Not Approved',
        description: 'Unfortunately, your application wasn\'t approved at this time. Please review our requirements and consider reapplying in the future.'
      },
      additional_info_required: {
        icon: Clock,
        color: 'text-orange-600',
        title: 'Additional Information Required',
        description: 'We need some additional information to process your application. Please check your email for details.'
      }
    }

    const status = statusConfig[existingApplication.status as keyof typeof statusConfig]
    const StatusIcon = status.icon

    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-6 w-6 ${status.color}`} />
              {status.title}
            </CardTitle>
            <CardDescription>
              Application submitted on {existingApplication.submittedAt.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{status.description}</AlertDescription>
            </Alert>

            {existingApplication.reviewNotes && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Review Notes:</p>
                <p className="text-sm text-muted-foreground">{existingApplication.reviewNotes}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">{existingApplication.businessName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {existingApplication.specializations.map((spec: string) => (
                  <Badge key={spec} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            {existingApplication.status === 'approved' && (
              <div className="pt-4">
                <Button 
                  onClick={() => router.push('/dashboard/expert/onboarding')}
                  className="w-full"
                >
                  Set Up Expert Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show application form
  return (
    <div className="container py-8">
      <ExpertApplicationForm />
    </div>
  )
}