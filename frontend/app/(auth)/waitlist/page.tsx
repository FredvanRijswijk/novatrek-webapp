'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Users, MapPin, Zap } from 'lucide-react';

function WaitlistForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [referralSource, setReferralSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    // Pre-fill email if provided in URL
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Trigger confetti animation when successfully joined waitlist
    if (submitted && position) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Shoot confetti from different angles
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [submitted, position]);

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
    
    // Validate that at least one interest is selected
    if (interests.length === 0) {
      alert('Please select at least one travel interest');
      return;
    }
    
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
        <Card className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <CardHeader className="text-center">
            <div className="relative inline-flex mx-auto mb-4">
              <div className="absolute inset-0 animate-ping">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400 opacity-25" />
                </div>
              </div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center relative">
                <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">You're on the list!</CardTitle>
            <CardDescription className="text-lg mt-2">
              {position && (
                <>
                  You are <span className="font-semibold text-primary">#{position}</span> in line
                </>
              )}
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
                <Label>What type of travel interests you? *</Label>
                <p className="text-sm text-muted-foreground">Select all that apply</p>
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
                <Select value={referralSource} onValueChange={setReferralSource}>
                  <SelectTrigger id="referral">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">X (Twitter)</SelectItem>
                    <SelectItem value="friend">Friend or colleague</SelectItem>
                    <SelectItem value="google">Google search</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="producthunt">Product Hunt</SelectItem>
                    <SelectItem value="reddit">Reddit</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="blog">Blog or article</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <div className="w-full max-w-lg p-4">
          <Card className="animate-pulse">
            <CardHeader className="text-center">
              <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4" />
              <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <WaitlistForm />
    </Suspense>
  );
}