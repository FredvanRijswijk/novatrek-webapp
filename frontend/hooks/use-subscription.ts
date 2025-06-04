import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/context';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';

interface SubscriptionData {
  subscription: any;
  currentPlan: string;
  isActive: boolean;
  limits: {
    activeTrips: number;
    itineraryDays: number;
    aiRequestsPerMonth: number;
  };
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    } else {
      setSubscription({
        subscription: null,
        currentPlan: 'free',
        isActive: false,
        limits: SUBSCRIPTION_PLANS.free.limits,
      });
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/subscription/status?userId=${user?.uid}`);
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Default to free plan on error
      setSubscription({
        subscription: null,
        currentPlan: 'free',
        isActive: false,
        limits: SUBSCRIPTION_PLANS.free.limits,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = (limitType: keyof SubscriptionData['limits'], currentUsage: number): boolean => {
    if (!subscription) return false;
    const limit = subscription.limits[limitType];
    return limit === -1 || currentUsage < limit;
  };

  const canCreateTrip = (activeTripsCount: number): boolean => {
    return checkLimit('activeTrips', activeTripsCount);
  };

  const canAddItineraryDay = (currentDays: number): boolean => {
    return checkLimit('itineraryDays', currentDays);
  };

  const canUseAI = (currentMonthUsage: number): boolean => {
    return checkLimit('aiRequestsPerMonth', currentMonthUsage);
  };

  return {
    subscription,
    loading,
    isSubscribed: subscription?.isActive || false,
    currentPlan: subscription?.currentPlan || 'free',
    limits: subscription?.limits || SUBSCRIPTION_PLANS.free.limits,
    canCreateTrip,
    canAddItineraryDay,
    canUseAI,
    checkLimit,
  };
}