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
import { dateValidation } from '@/lib/utils/validation';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          // Pre-fill from user preferences, but preserve existing form data
          setFormData(prev => ({
            ...prev,
            travelers: prev.travelers.length > 0 && prev.travelers[0].name === '' 
              ? [{ ...prev.travelers[0], name: user.displayName || '' }]
              : prev.travelers,
            travelStyle: profile.preferences?.travelStyle || prev.travelStyle,
            accommodationType: profile.preferences?.accommodationType || prev.accommodationType,
            activityTypes: profile.preferences?.activityTypes || prev.activityTypes,
            budgetRange: {
              ...prev.budgetRange,
              currency: profile.preferences?.currency || prev.budgetRange.currency
            }
          }));
        }
      });
    }
  }, [user]);

  const updateFormData = (updates: Partial<TripFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Validate destination
        if (!formData.destination) {
          newErrors.destination = 'Please select a destination';
        }

        // Validate dates
        if (!formData.startDate) {
          newErrors.startDate = 'Please select a start date';
        } else if (!dateValidation.isFutureDate(formData.startDate)) {
          newErrors.startDate = 'Start date must be in the future';
        }

        if (!formData.endDate) {
          newErrors.endDate = 'Please select an end date';
        } else if (formData.startDate && !dateValidation.isValidDateRange(formData.startDate, formData.endDate)) {
          newErrors.endDate = 'End date must be after start date';
        } else if (formData.startDate && !dateValidation.maxTripDuration(formData.startDate, formData.endDate, 365)) {
          newErrors.endDate = 'Trip duration cannot exceed 365 days';
        }

        // Validate travelers
        if (formData.travelers.length === 0) {
          newErrors.travelers = 'At least one traveler is required';
        } else {
          const hasEmptyName = formData.travelers.some(t => !t.name || t.name.trim() === '');
          if (hasEmptyName) {
            newErrors.travelers = 'All travelers must have a name';
          }
        }
        break;

      case 2:
        // Validate activity types
        if (formData.activityTypes.length === 0) {
          newErrors.activityTypes = 'Please select at least one activity type';
        }

        // Validate budget
        if (formData.budgetRange.min >= formData.budgetRange.max) {
          newErrors.budget = 'Maximum budget must be greater than minimum';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
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
        const hasDestination = formData.destination !== null && formData.destination !== undefined;
        const hasStartDate = formData.startDate !== null && formData.startDate !== undefined;
        const hasEndDate = formData.endDate !== null && formData.endDate !== undefined;
        const hasTravelers = formData.travelers.length > 0 && formData.travelers[0]?.name?.trim() !== '';
        
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
        travelers: formData.travelers.map((traveler, index) => {
          const travelerData: any = {
            id: `traveler_${index}`,
            name: traveler.name,
            relationship: traveler.relationship
          };
          // Only include age if it's defined
          if (traveler.age !== undefined && traveler.age !== null) {
            travelerData.age = traveler.age;
          }
          return travelerData;
        }),
        itinerary: [],
        status: 'planning'
      };

      const tripId = await TripModel.create(tripData);
      
      // Redirect to the trip planning page
      router.push(`/dashboard/trips/${tripId}/plan`);
    } catch (error) {
      console.error('Error creating trip:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to create trip. Please try again.' 
      });
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
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            <p className="text-sm">{errors.general}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <DestinationDateStep 
            formData={formData} 
            updateFormData={updateFormData}
            errors={errors}
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
                {(!formData.destination || formData.destination === null) && <li>Select a destination</li>}
                {(!formData.startDate || formData.startDate === null) && <li>Choose a start date</li>}
                {(!formData.endDate || formData.endDate === null) && <li>Choose an end date</li>}
                {(!formData.travelers[0]?.name || formData.travelers[0]?.name.trim() === '') && <li>Enter traveler name</li>}
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