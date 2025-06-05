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
  destination: Destination | null; // Keep for single destination
  destinations: Array<{
    destination: Destination;
    arrivalDate: Date | null;
    departureDate: Date | null;
    order: number;
  }>; // New multi-destination support
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
    destinations: [],
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
        const hasValidDestinations = formData.destinations.length > 0 
          ? formData.destinations.some((d: any) => d.destination)
          : !!formData.destination;
        if (!hasValidDestinations) {
          newErrors.destination = 'Please select at least one destination';
        }
        
        // Validate multi-destination dates
        if (formData.destinations.length > 0) {
          const missingDates = formData.destinations.some((d: any) => 
            d.destination && (!d.arrivalDate || !d.departureDate)
          );
          if (missingDates) {
            newErrors.destinations = 'Please set arrival and departure dates for all destinations';
          }
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
        const hasValidDestination = formData.destinations.length > 0 
          ? formData.destinations.some((d: any) => d.destination)
          : !!formData.destination;
        const hasStartDate = formData.startDate !== null && formData.startDate !== undefined;
        const hasEndDate = formData.endDate !== null && formData.endDate !== undefined;
        const hasTravelers = formData.travelers.length > 0 && formData.travelers[0]?.name?.trim() !== '';
        
        // For multi-destination, also check if all destinations have dates
        let hasCompleteDates = true;
        if (formData.destinations.length > 0) {
          hasCompleteDates = formData.destinations.every((d: any) => 
            !d.destination || (d.arrivalDate && d.departureDate)
          );
        }
        
        return hasValidDestination && hasStartDate && hasEndDate && hasTravelers && hasCompleteDates;
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
    const hasValidDestinations = formData.destinations.length > 0 
      ? formData.destinations.some((d: any) => d.destination)
      : !!formData.destination;
    if (!user || !hasValidDestinations || !formData.startDate || !formData.endDate) {
      return;
    }

    setIsCreating(true);

    try {
      const hasMultipleDestinations = formData.destinations.length > 0 && formData.destinations.some((d: any) => d.destination);
      
      // Create trip title safely
      let tripTitle = 'New Trip';
      if (hasMultipleDestinations) {
        const destinationNames = formData.destinations
          .filter((d: any) => d.destination)
          .map((d: any) => d.destination.name);
        if (destinationNames.length > 0) {
          tripTitle = `Trip to ${destinationNames.join(', ')}`;
        }
      } else if (formData.destination) {
        tripTitle = `Trip to ${formData.destination.name}`;
      }
      
      // Create trip description safely
      let tripDescription = formData.customRequests || 'New adventure';
      if (!formData.customRequests) {
        if (hasMultipleDestinations) {
          const destinationNames = formData.destinations
            .filter((d: any) => d.destination)
            .map((d: any) => d.destination.name);
          if (destinationNames.length > 0) {
            tripDescription = `Exploring ${destinationNames.join(', ')}`;
          }
        } else if (formData.destination) {
          tripDescription = `Exploring ${formData.destination.name}`;
        }
      }

      const tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        title: tripTitle,
        description: tripDescription,
        destination: hasMultipleDestinations ? undefined : formData.destination || undefined,
        destinations: hasMultipleDestinations ? formData.destinations.map((d: any) => ({
          destination: d.destination,
          arrivalDate: d.arrivalDate,
          departureDate: d.departureDate,
          order: d.order
        })) : undefined,
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
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Create Your Trip</h1>
          <p className="text-base text-muted-foreground mt-2">Let's plan your perfect journey</p>
        </div>

        {/* Steps Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between relative">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Connector Line - positioned before circle for proper layering */}
                {index > 0 && (
                  <div className="absolute top-5 h-0.5 bg-muted" style={{
                    left: `${(100 / STEPS.length) * index - (50 / STEPS.length)}%`,
                    width: `${100 / STEPS.length}%`,
                  }}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        step.id <= currentStep ? 'bg-primary' : ''
                      }`}
                    />
                  </div>
                )}
                
                {/* Step Circle */}
                <div className="relative z-10">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                      transition-all duration-200 border-2
                      ${step.id < currentStep 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : step.id === currentStep
                        ? 'bg-background text-foreground border-primary'
                        : 'bg-background text-muted-foreground border-muted'
                      }
                    `}
                  >
                    {step.id < currentStep ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                </div>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 space-y-6">
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
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
            <div className="mt-8 pt-8 border-t">
              {/* Show validation hints */}
              {currentStep === 1 && !canProceed() && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2 text-sm">To continue, please complete:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {(formData.destinations.length === 0 && (!formData.destination || formData.destination === null)) && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        Select a destination
                      </li>
                    )}
                    {(formData.destinations.length > 0 && !formData.destinations.some((d: any) => d.destination)) && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        Select at least one destination
                      </li>
                    )}
                    {(formData.destinations.length > 0 && formData.destinations.some((d: any) => d.destination && (!d.arrivalDate || !d.departureDate))) && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        Set dates for all destinations
                      </li>
                    )}
                    {(!formData.startDate || formData.startDate === null) && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        Choose a start date
                      </li>
                    )}
                    {(!formData.endDate || formData.endDate === null) && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        Choose an end date
                      </li>
                    )}
                    {(!formData.travelers[0]?.name || formData.travelers[0]?.name.trim() === '') && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        Enter traveler name
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={previousStep}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Step {currentStep} of {STEPS.length}
                  </span>
                  
                  {currentStep < STEPS.length ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="gap-2"
                    >
                      Continue
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  ) : (
                    <Button
                      onClick={createTrip}
                      disabled={!canProceed() || isCreating}
                      className="gap-2"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Trip
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}