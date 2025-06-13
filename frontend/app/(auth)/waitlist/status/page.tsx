'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Clock, CheckCircle, Mail, UserCheck } from 'lucide-react';

function WaitlistStatusForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    position?: number;
    status?: string;
    joinedAt?: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pre-fill email from URL parameter
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      // Auto-check status if email is provided
      setTimeout(() => {
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }, 100);
    }
  }, [searchParams]);

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const response = await fetch(`/api/waitlist?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Email not found on waitlist. Would you like to join?');
        } else {
          setError('Failed to check status. Please try again.');
        }
        return;
      }

      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
      setError('Failed to check status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'invited':
        return Mail;
      case 'joined':
        return UserCheck;
      default:
        return Clock;
    }
  };

  const getStatusMessage = (status: string, position?: number) => {
    switch (status) {
      case 'pending':
        return `You're #${position} in line. We'll notify you when it's your turn!`;
      case 'approved':
        return 'Your application has been approved! You\'ll receive an invitation soon.';
      case 'invited':
        return 'Check your email! Your invitation has been sent.';
      case 'joined':
        return 'You already have access to NovaTrek!';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'approved':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'invited':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'joined':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Check Your Waitlist Status</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email to see your position in line
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Lookup</CardTitle>
            <CardDescription>
              We'll check if you're on the waitlist and show your current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={checkStatus} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>Checking...</>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                <p>{error}</p>
                {error.includes('Would you like to join?') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push('/waitlist')}
                  >
                    Join Waitlist
                  </Button>
                )}
              </div>
            )}

            {status && (
              <div className="mt-6 space-y-4">
                <div className={`p-6 rounded-lg text-center ${getStatusColor(status.status!)}`}>
                  {(() => {
                    const Icon = getStatusIcon(status.status!);
                    return <Icon className="h-12 w-12 mx-auto mb-3" />;
                  })()}
                  
                  <h3 className="font-semibold text-lg mb-2">
                    {status.status === 'pending' ? 'On the Waitlist' : 
                     status.status === 'approved' ? 'Approved!' :
                     status.status === 'invited' ? 'Invited!' :
                     'Welcome Back!'}
                  </h3>
                  
                  <p className="text-sm">
                    {getStatusMessage(status.status!, status.position)}
                  </p>
                  
                  {status.joinedAt && (
                    <p className="text-xs mt-2 opacity-75">
                      Joined {new Date(status.joinedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {status.status === 'invited' && (
                  <Button 
                    className="w-full" 
                    onClick={() => router.push('/login')}
                  >
                    Sign In Now
                  </Button>
                )}

                {status.status === 'joined' && (
                  <Button 
                    className="w-full" 
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WaitlistStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <WaitlistStatusForm />
    </Suspense>
  );
}