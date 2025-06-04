'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFirebase } from '@/lib/firebase/context';
import { useRouter } from 'next/navigation';
import { TripModel } from '@/lib/models/trip';
import { UserModel } from '@/lib/models/user';
import { User, Trip, Destination, Budget, ActivityType } from '@/types/travel';

// Step Components
import { DestinationDateStep } from './wizard-steps/DestinationDateStep';
import { TravelStyleStep } from './wizard-steps/TravelStyleStep';
import { AIKickstartStep } from './wizard-steps/AIKickstartStep';
import { ReviewStep } from './wizard-steps/ReviewStep';

interface TripFormData {
  // Step 1: Destination & Dates
  destination: Destination | null;
  startDate: Date | null;
  endDate: Date | null;
  travelers: Array<{
    name: string;
    relationship: 'self' | 'partner' | 'family' | 'friend';
    age?: number;
  }>;

  // Step 2: Travel Style & Preferences
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  accommodationType: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'any';
  activityTypes: ActivityType[];
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };

  // Step 3: AI Kickstart
  aiSuggestions: any[];
  selectedSuggestions: string[];
  customRequests: string;
}

const STEPS = [
  { id: 1, title: 'Destination & Dates', description: 'Where and when are you going?' },
  { id: 2, title: 'Travel Style', description: 'Tell us about your preferences' },
  { id: 3, title: 'AI Kickstart', description: 'Get personalized recommendations' },
  { id: 4, title: 'Review & Create', description: 'Review and create your trip' }
];

export function TripCreationWizard() {
  const { user } = useFirebase();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const [formData, setFormData] = useState<TripFormData>({
    destination: null,
    startDate: null,
    endDate: null,
    travelers: [{ name: user?.displayName || '', relationship: 'self' }],
    travelStyle: 'mid-range',
    accommodationType: 'any',
    activityTypes: [],
    budgetRange: { min: 1000, max: 5000, currency: 'USD' },
    aiSuggestions: [],
    selectedSuggestions: [],
    customRequests: ''
  });

  // Load user profile for smart defaults
  useEffect(() => {
    if (user) {
      UserModel.getById(user.uid).then(profile => {
        if (profile) {
          setUserProfile(profile);
          // Pre-fill from user preferences
          setFormData(prev => ({
            ...prev,
            travelStyle: profile.preferences?.travelStyle || 'mid-range',
            accommodationType: profile.preferences?.accommodationType || 'any',
            activityTypes: profile.preferences?.activityTypes || [],
            budgetRange: {
              ...prev.budgetRange,
              currency: profile.preferences?.currency || 'USD'
            }
          }));
        }
      });
    }
  }, [user]);

  const updateFormData = (updates: Partial<TripFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Check if all required fields are filled
        const hasDestination = formData.destination !== null;
        const hasStartDate = formData.startDate !== null;
        const hasEndDate = formData.endDate !== null;
        const hasTravelers = formData.travelers.length > 0 && formData.travelers[0].name.trim() !== '';
        
        return hasDestination && hasStartDate && hasEndDate && hasTravelers;
      case 2:
        return formData.activityTypes.length > 0;
      case 3:
        return true; // AI step is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const createTrip = async () => {
    if (!user || !formData.destination || !formData.startDate || !formData.endDate) {
      return;
    }

    setIsCreating(true);

    try {
      const tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        title: `Trip to ${formData.destination.name}`,
        description: formData.customRequests || `Exploring ${formData.destination.name}`,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: {
          total: formData.budgetRange.max,
          currency: formData.budgetRange.currency,
          breakdown: {
            accommodation: Math.round(formData.budgetRange.max * 0.4),
            transportation: Math.round(formData.budgetRange.max * 0.2),
            food: Math.round(formData.budgetRange.max * 0.2),
            activities: Math.round(formData.budgetRange.max * 0.15),
            miscellaneous: Math.round(formData.budgetRange.max * 0.05)
          }
        },
        travelers: formData.travelers.map((traveler, index) => ({
          id: `traveler_${index}`,
          name: traveler.name,
          relationship: traveler.relationship,
          age: traveler.age
        })),
        itinerary: [],
        status: 'planning'
      };

      const tripId = await TripModel.create(tripData);
      
      // Redirect to the trip planning page
      router.push(`/dashboard/trips/${tripId}/plan`);
    } catch (error) {
      console.error('Error creating trip:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <div>
            <CardTitle className="text-2xl">
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Content */}
        {currentStep === 1 && (
          <DestinationDateStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        
        {currentStep === 2 && (
          <TravelStyleStep 
            formData={formData} 
            updateFormData={updateFormData}
            userProfile={userProfile}
          />
        )}
        
        {currentStep === 3 && (
          <AIKickstartStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        
        {currentStep === 4 && (
          <ReviewStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}

        {/* Navigation */}
        <div className="pt-6 border-t">
          {/* Show validation hints for step 1 */}
          {currentStep === 1 && !canProceed() && (
            <div className="mb-4 text-sm text-muted-foreground">
              <p>To continue, please complete:</p>
              <ul className="list-disc list-inside mt-1">
                {!formData.destination && <li>Select a destination</li>}
                {!formData.startDate && <li>Choose a start date</li>}
                {!formData.endDate && <li>Choose an end date</li>}
                {formData.travelers[0]?.name.trim() === '' && <li>Enter traveler name</li>}
              </ul>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={createTrip}
                disabled={!canProceed() || isCreating}
              >
                {isCreating ? 'Creating Trip...' : 'Create Trip'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}