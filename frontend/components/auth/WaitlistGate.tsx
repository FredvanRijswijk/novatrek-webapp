'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/context';
import { checkWaitlistAccess } from '@/lib/firebase/auth-waitlist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Check } from 'lucide-react';

interface WaitlistGateProps {
  children: React.ReactNode;
  adminBypass?: boolean;
}

export function WaitlistGate({ children, adminBypass = false }: WaitlistGateProps) {
  const { user, loading: authLoading } = useFirebase();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<string>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    checkAccess();
  }, [user, authLoading]);

  const checkAccess = async () => {
    if (!user) return;

    try {
      // Check if user is admin and bypass is enabled
      if (adminBypass) {
        const token = await user.getIdTokenResult();
        if (token.claims.admin === true) {
          setHasAccess(true);
          setCheckingAccess(false);
          return;
        }
      }

      const result = await checkWaitlistAccess(user);
      setHasAccess(result.hasAccess);
      setWaitlistStatus(result.waitlistStatus || '');
      setMessage(result.message || '');
    } catch (error) {
      console.error('Error checking waitlist access:', error);
      setMessage('Error checking access. Please try refreshing the page.');
    } finally {
      setCheckingAccess(false);
    }
  };

  if (authLoading || checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    const statusIcons = {
      pending: Clock,
      approved: Check,
      invited: Mail,
    };
    const Icon = statusIcons[waitlistStatus as keyof typeof statusIcons] || Clock;

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {waitlistStatus === 'approved' ? 'Coming Soon!' : 'You're on the Waitlist'}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {waitlistStatus === 'pending' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">While you wait:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• We're carefully onboarding users for the best experience</li>
                  <li>• You'll get early access to all premium features</li>
                  <li>• Founding members receive special pricing forever</li>
                </ul>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => {
                  router.push('/dashboard/profile');
                }}
                className="flex-1"
              >
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}