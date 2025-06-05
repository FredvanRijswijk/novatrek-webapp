'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TripOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  useEffect(() => {
    // Redirect to the planning page by default
    router.push(`/dashboard/trips/${tripId}/plan`);
  }, [tripId, router]);

  return null;
}