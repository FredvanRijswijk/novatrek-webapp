'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Users, MapPin, Zap } from 'lucide-react';

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [referralSource, setReferralSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  const interestOptions = [
    { id: 'solo', label: 'Solo Travel' },
    { id: 'family', label: 'Family Trips' },
    { id: 'adventure', label: 'Adventure Travel' },
    { id: 'luxury', label: 'Luxury Experiences' },
    { id: 'budget', label: 'Budget Travel' },
    { id: 'business', label: 'Business Travel' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          interests,
          referralSource,
          metadata: {
            userAgent: navigator.userAgent,
            utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join waitlist');
      }

      const data = await response.json();
      setPosition(data.position);
      setSubmitted(true);
    } catch (error) {
      console.error('Waitlist error:', error);
      alert(error instanceof Error ? error.message : 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">You're on the list!</CardTitle>
            <CardDescription className="text-lg mt-2">
              {position && `You're #${position} in line`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              We'll send you an email as soon as we're ready for you to join NovaTrek.
            </p>
            <div className="space-y-2 pt-4">
              <p className="text-sm font-medium">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll review your application</li>
                <li>• You'll receive an invite when a spot opens</li>
                <li>• Early access to all premium features</li>
                <li>• Special founding member pricing</li>
              </ul>
            </div>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl w-full grid gap-8 lg:grid-cols-2 items-center">
        {/* Left side - Benefits */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">Join the NovaTrek Beta</h1>
            <p className="text-xl text-muted-foreground">
              Be among the first to experience AI-powered travel planning that actually works.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Early Access</h3>
                <p className="text-sm text-muted-foreground">
                  Get exclusive access to features before public launch
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Founding Member Status</h3>
                <p className="text-sm text-muted-foreground">
                  Lock in special pricing and perks forever
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Shape the Future</h3>
                <p className="text-sm text-muted-foreground">
                  Your feedback will directly influence our roadmap
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Limited spots available.</strong> We're onboarding users gradually to ensure the best experience for everyone.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <Card>
          <CardHeader>
            <CardTitle>Request Early Access</CardTitle>
            <CardDescription>
              Tell us a bit about yourself and your travel style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>What type of travel interests you?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={interests.includes(option.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setInterests([...interests, option.id]);
                          } else {
                            setInterests(interests.filter(i => i !== option.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={option.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral">How did you hear about us?</Label>
                <Input
                  id="referral"
                  type="text"
                  placeholder="Twitter, friend, etc."
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Joining...' : 'Join Waitlist'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By joining, you agree to receive occasional emails about NovaTrek.
                You can unsubscribe anytime.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}