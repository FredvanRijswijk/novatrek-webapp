import { useEffect, useState } from 'react';
import { useFirebase } from '@/lib/firebase/context';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans';
import { useErrorHandler } from './use-error-handler';

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
  const { user } = useFirebase();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError, logAction } = useErrorHandler();

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
    const startTime = Date.now();
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if response is ok
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        await handleError(error, 'fetchSubscriptionStatus', {
          category: 'subscription',
          showToast: false
        });
        throw error;
      }
      
      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const error = new Error("Response is not JSON");
        await handleError(error, 'fetchSubscriptionStatus', {
          category: 'subscription',
          showToast: false
        });
        throw error;
      }
      
      const data = await response.json();
      setSubscription(data);
      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Default to free plan on error
      const defaultData = {
        subscription: null,
        currentPlan: 'free',
        isActive: false,
        limits: SUBSCRIPTION_PLANS.free.limits,
      };
      setSubscription(defaultData);
      return defaultData;
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
    fetchSubscriptionStatus,
  };
}