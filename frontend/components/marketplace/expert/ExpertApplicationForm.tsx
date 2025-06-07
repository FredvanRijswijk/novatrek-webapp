'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, X, InfoIcon } from 'lucide-react'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel } from '@/lib/models/marketplace'

const SPECIALIZATION_OPTIONS = [
  'Adventure Travel',
  'Luxury Travel',
  'Budget Travel',
  'Family Travel',
  'Solo Travel',
  'Romantic Getaways',
  'Business Travel',
  'Cultural Tourism',
  'Eco-Tourism',
  'Food & Wine',
  'Wellness & Spa',
  'Beach & Island',
  'Mountain & Skiing',
  'City Breaks',
  'Road Trips',
  'Cruise Planning',
  'Group Tours',
  'Photography Tours',
  'Wildlife & Safari',
  'Historical Tours'
]

export function ExpertApplicationForm() {
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: user?.email || '',
    phone: '',
    experience: '',
    specializations: [] as string[],
    portfolioUrl: '',
    additionalPortfolioUrls: [] as string[],
    references: '',
    agreeToTerms: false
  })

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }))
  }

  const handleAddPortfolioUrl = () => {
    if (formData.portfolioUrl && formData.additionalPortfolioUrls.length < 4) {
      setFormData(prev => ({
        ...prev,
        additionalPortfolioUrls: [...prev.additionalPortfolioUrls, prev.portfolioUrl],
        portfolioUrl: ''
      }))
    }
  }

  const handleRemovePortfolioUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalPortfolioUrls: prev.additionalPortfolioUrls.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to apply')
      return
    }

    if (formData.specializations.length === 0) {
      setError('Please select at least one specialization')
      return
    }

    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if user already has an application
      const existingApplication = await MarketplaceModel.getApplicationByUserId(user.uid)
      if (existingApplication) {
        setError('You have already submitted an application. Please wait for review.')
        return
      }

      // Combine all portfolio URLs
      const allPortfolioUrls = formData.additionalPortfolioUrls
      if (formData.portfolioUrl) {
        allPortfolioUrls.push(formData.portfolioUrl)
      }

      // Submit application
      const applicationId = await MarketplaceModel.submitApplication({
        userId: user.uid,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        specializations: formData.specializations,
        portfolio: allPortfolioUrls,
        references: formData.references.split('\n').filter(r => r.trim())
      })

      // Send confirmation email (non-blocking)
      try {
        const token = await user.getIdToken()
        await fetch('/api/email/expert-application', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'received',
            applicationId
          })
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't block the success flow if email fails
      }

      setSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (err) {
      console.error('Application submission error:', err)
      setError('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Application Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Thank you for applying to become a NovaTrek Travel Expert. We'll review your application
              and get back to you within 2-3 business days. You'll receive an email notification
              once your application has been reviewed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Become a NovaTrek Travel Expert</CardTitle>
            <CardDescription>
              Join our marketplace and share your travel expertise with thousands of travelers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Your travel business or personal brand name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Experience & Expertise</h3>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Tell us about your travel expertise *</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Describe your experience in the travel industry, certifications, unique expertise, and why you want to join NovaTrek..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Specializations * (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SPECIALIZATION_OPTIONS.map((specialization) => (
                    <label
                      key={specialization}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={formData.specializations.includes(specialization)}
                        onCheckedChange={() => handleSpecializationToggle(specialization)}
                      />
                      <span className="text-sm">{specialization}</span>
                    </label>
                  ))}
                </div>
                {formData.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Portfolio & References</h3>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio Links</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="portfolio"
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      placeholder="https://your-website.com"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddPortfolioUrl}
                      disabled={!formData.portfolioUrl || formData.additionalPortfolioUrls.length >= 4}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.additionalPortfolioUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={url} disabled />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePortfolioUrl(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Add links to your website, social media, or past work
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">Professional References</Label>
                <Textarea
                  id="references"
                  value={formData.references}
                  onChange={(e) => setFormData(prev => ({ ...prev, references: e.target.value }))}
                  placeholder="Enter references (one per line)&#10;Name - Company - Contact"
                  rows={3}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I agree to the terms and conditions *
                  </label>
                  <p className="text-sm text-muted-foreground">
                    By applying, you agree to NovaTrek's marketplace terms, including our 15% platform fee
                    on all transactions and our quality standards.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}