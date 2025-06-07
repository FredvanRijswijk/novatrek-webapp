'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/lib/firebase/context';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans';
import { CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  subscription: any;
  currentPlan: string;
  isActive: boolean;
  limits: any;
}

export function SubscriptionStatus() {
  const { user } = useFirebase();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/subscription/status?userId=${user?.uid}`);
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>;
  }

  const plan = SUBSCRIPTION_PLANS[subscription?.currentPlan as keyof typeof SUBSCRIPTION_PLANS];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your plan and billing</CardDescription>
          </div>
          <CreditCard className="h-5 w-5 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Plan</span>
          <Badge variant={subscription?.isActive ? 'default' : 'secondary'}>
            {plan?.name || 'Free'}
          </Badge>
        </div>

        {subscription?.subscription && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className="capitalize">{subscription.subscription.status}</span>
            </div>

            {subscription.subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Next billing date</span>
                <span>
                  {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}

            {subscription.subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>Your subscription will end on {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            )}
          </>
        )}

        <div className="pt-2 space-y-2">
          <h4 className="text-sm font-medium">Plan Limits</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Active trips: {subscription?.limits.activeTrips === -1 ? 'Unlimited' : subscription?.limits.activeTrips}</div>
            <div>Itinerary days: {subscription?.limits.itineraryDays === -1 ? 'Unlimited' : subscription?.limits.itineraryDays}</div>
            <div>AI requests/month: {subscription?.limits.aiRequestsPerMonth === -1 ? 'Unlimited' : subscription?.limits.aiRequestsPerMonth}</div>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          {subscription?.isActive ? (
            <Button 
              onClick={handleManageSubscription} 
              disabled={portalLoading}
              className="w-full"
              variant="outline"
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.href = '/pricing'} 
              className="w-full"
            >
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}