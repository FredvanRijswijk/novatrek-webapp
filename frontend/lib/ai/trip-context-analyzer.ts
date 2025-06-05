import { Trip, DayItinerary } from '@/types/travel'
import { differenceInDays, format, parseISO } from 'date-fns'

export interface TripAnalysis {
  stage: 'initial' | 'partial' | 'detailed' | 'complete'
  completionPercentage: number
  missingElements: string[]
  suggestions: string[]
  nextSteps: string[]
  stats: {
    daysPlanned: number
    totalDays: number
    activitiesCount: number
    budgetUsed: number
    budgetRemaining: number
    averageActivitiesPerDay: number
  }
}

export interface EnhancedTripContext {
  // Basic trip info
  tripId: string
  destinations: string[]
  duration: number
  startDate: string
  endDate: string
  travelers: number
  
  // Planning progress
  planningStage: TripAnalysis['stage']
  completionPercentage: number
  daysWithActivities: number
  emptyDays: number[]
  
  // Budget context
  budget?: {
    total: number
    spent: number
    remaining: number
    currency: string
    categoryBreakdown: Record<string, number>
  }
  
  // Activity context
  activities: {
    total: number
    byCategory: Record<string, number>
    byDay: Record<number, number>
    avgDuration: number
  }
  
  // User preferences integration
  preferences?: {
    pace: string
    interests: string[]
    activityTypes: string[]
    budget: string
  }
  
  // Smart suggestions
  suggestions: {
    immediate: string[]
    upcoming: string[]
    improvements: string[]
  }
}

export function analyzeTripProgress(trip: Trip): TripAnalysis {
  const totalDays = differenceInDays(
    new Date(trip.endDate), 
    new Date(trip.startDate)
  ) + 1
  
  const daysPlanned = trip.itinerary?.filter(day => 
    day.activities && day.activities.length > 0
  ).length || 0
  
  const totalActivities = trip.itinerary?.reduce((sum, day) => 
    sum + (day.activities?.length || 0), 0
  ) || 0
  
  const budgetUsed = calculateBudgetUsed(trip)
  const budgetTotal = trip.budget?.total || 0
  
  // Determine planning stage
  let stage: TripAnalysis['stage'] = 'initial'
  if (totalActivities === 0) {
    stage = 'initial'
  } else if (daysPlanned < totalDays * 0.3) {
    stage = 'partial'
  } else if (daysPlanned < totalDays * 0.7) {
    stage = 'detailed'
  } else {
    stage = 'complete'
  }
  
  // Calculate completion percentage
  const dayCompleteness = (daysPlanned / totalDays) * 40
  const activityDensity = Math.min((totalActivities / (totalDays * 3)) * 30, 30)
  const budgetPlanning = trip.budget ? 20 : 0
  const accommodationPlanning = trip.accommodations?.length ? 10 : 0
  
  const completionPercentage = Math.round(
    dayCompleteness + activityDensity + budgetPlanning + accommodationPlanning
  )
  
  // Identify missing elements
  const missingElements = []
  if (!trip.budget) missingElements.push('Budget not set')
  if (daysPlanned < totalDays) missingElements.push(`${totalDays - daysPlanned} days without activities`)
  if (!trip.accommodations?.length) missingElements.push('No accommodations booked')
  if (totalActivities < totalDays * 2) missingElements.push('Consider adding more activities')
  
  // Generate contextual suggestions
  const suggestions = generateSmartSuggestions(trip, stage, missingElements)
  const nextSteps = generateNextSteps(trip, stage)
  
  return {
    stage,
    completionPercentage,
    missingElements,
    suggestions,
    nextSteps,
    stats: {
      daysPlanned,
      totalDays,
      activitiesCount: totalActivities,
      budgetUsed,
      budgetRemaining: budgetTotal - budgetUsed,
      averageActivitiesPerDay: totalActivities / Math.max(daysPlanned, 1)
    }
  }
}

export function createEnhancedContext(
  trip: Trip, 
  userPreferences?: any
): EnhancedTripContext {
  const analysis = analyzeTripProgress(trip)
  const emptyDays = findEmptyDays(trip)
  
  // Activity analysis
  const activityAnalysis = analyzeActivities(trip)
  
  // Budget analysis
  const budgetAnalysis = trip.budget ? {
    total: trip.budget.total,
    spent: calculateBudgetUsed(trip),
    remaining: trip.budget.total - calculateBudgetUsed(trip),
    currency: trip.budget.currency,
    categoryBreakdown: calculateCategoryBreakdown(trip)
  } : undefined
  
  // Generate smart, contextual suggestions
  const suggestions = {
    immediate: generateImmediateSuggestions(trip, analysis, emptyDays),
    upcoming: generateUpcomingSuggestions(trip, analysis),
    improvements: generateImprovementSuggestions(trip, analysis)
  }
  
  return {
    // Basic info
    tripId: trip.id,
    destinations: trip.destinations?.map(d => d.destination?.name || '').filter(Boolean) || 
                  [trip.destination?.name || 'Unknown'],
    duration: analysis.stats.totalDays,
    startDate: trip.startDate.toString(),
    endDate: trip.endDate.toString(),
    travelers: trip.travelers.length,
    
    // Progress tracking
    planningStage: analysis.stage,
    completionPercentage: analysis.completionPercentage,
    daysWithActivities: analysis.stats.daysPlanned,
    emptyDays,
    
    // Budget
    budget: budgetAnalysis,
    
    // Activities
    activities: activityAnalysis,
    
    // Preferences
    preferences: userPreferences ? {
      pace: userPreferences.pacePreference || 'moderate',
      interests: userPreferences.interests || [],
      activityTypes: userPreferences.activityTypes || [],
      budget: userPreferences.budgetRange || 'medium'
    } : undefined,
    
    // Suggestions
    suggestions
  }
}

// Helper functions
function calculateBudgetUsed(trip: Trip): number {
  return trip.itinerary?.reduce((total, day) => 
    total + (day.activities?.reduce((dayTotal, activity) => 
      dayTotal + (activity.estimatedCost || 0), 0
    ) || 0), 0
  ) || 0
}

function findEmptyDays(trip: Trip): number[] {
  const emptyDays: number[] = []
  const totalDays = differenceInDays(
    new Date(trip.endDate), 
    new Date(trip.startDate)
  ) + 1
  
  for (let i = 1; i <= totalDays; i++) {
    const dayItinerary = trip.itinerary?.find(day => day.dayNumber === i)
    if (!dayItinerary || !dayItinerary.activities?.length) {
      emptyDays.push(i)
    }
  }
  
  return emptyDays
}

function analyzeActivities(trip: Trip) {
  const activities = trip.itinerary?.flatMap(day => day.activities || []) || []
  const byCategory: Record<string, number> = {}
  const byDay: Record<number, number> = {}
  
  activities.forEach(activity => {
    const category = activity.category || 'Other'
    byCategory[category] = (byCategory[category] || 0) + 1
  })
  
  trip.itinerary?.forEach(day => {
    byDay[day.dayNumber] = day.activities?.length || 0
  })
  
  const totalDuration = activities.reduce((sum, activity) => 
    sum + (activity.duration || 120), 0
  )
  
  return {
    total: activities.length,
    byCategory,
    byDay,
    avgDuration: activities.length > 0 ? totalDuration / activities.length : 0
  }
}

function calculateCategoryBreakdown(trip: Trip): Record<string, number> {
  const breakdown: Record<string, number> = {}
  
  trip.itinerary?.forEach(day => {
    day.activities?.forEach(activity => {
      const category = activity.category || 'Other'
      breakdown[category] = (breakdown[category] || 0) + (activity.estimatedCost || 0)
    })
  })
  
  return breakdown
}

function generateSmartSuggestions(
  trip: Trip, 
  stage: TripAnalysis['stage'], 
  missingElements: string[]
): string[] {
  const suggestions: string[] = []
  
  switch (stage) {
    case 'initial':
      suggestions.push('Start by adding must-see attractions for your first day')
      suggestions.push('Set a daily budget to help plan activities')
      break
    case 'partial':
      suggestions.push('Focus on planning your first few days in detail')
      suggestions.push('Research restaurants near your planned activities')
      break
    case 'detailed':
      suggestions.push('Fill in the remaining days with activities')
      suggestions.push('Consider booking accommodations if not done')
      break
    case 'complete':
      suggestions.push('Review your itinerary for optimization opportunities')
      suggestions.push('Check opening hours and book tickets in advance')
      break
  }
  
  return suggestions
}

function generateNextSteps(trip: Trip, stage: TripAnalysis['stage']): string[] {
  const steps: string[] = []
  
  if (!trip.budget) {
    steps.push('Set your trip budget')
  }
  
  const emptyDays = findEmptyDays(trip)
  if (emptyDays.length > 0) {
    steps.push(`Plan activities for day ${emptyDays[0]}`)
  }
  
  if (!trip.accommodations?.length) {
    steps.push('Book accommodations')
  }
  
  if (stage === 'detailed' || stage === 'complete') {
    steps.push('Research restaurant reservations')
    steps.push('Check visa requirements')
  }
  
  return steps.slice(0, 3) // Return top 3 next steps
}

function generateImmediateSuggestions(
  trip: Trip, 
  analysis: TripAnalysis, 
  emptyDays: number[]
): string[] {
  const suggestions: string[] = []
  
  if (emptyDays.length > 0) {
    suggestions.push(`Day ${emptyDays[0]} has no activities yet. Would you like suggestions?`)
  }
  
  if (analysis.stats.averageActivitiesPerDay < 2) {
    suggestions.push('Your days seem light. Shall I suggest more activities?')
  }
  
  if (analysis.stats.budgetRemaining < 0) {
    suggestions.push('You\'re over budget. Want help optimizing costs?')
  }
  
  return suggestions
}

function generateUpcomingSuggestions(
  trip: Trip, 
  analysis: TripAnalysis
): string[] {
  const suggestions: string[] = []
  const daysUntilTrip = differenceInDays(new Date(trip.startDate), new Date())
  
  if (daysUntilTrip < 30 && daysUntilTrip > 0) {
    suggestions.push('Your trip is coming up! Time to finalize bookings')
  }
  
  if (daysUntilTrip < 7 && daysUntilTrip > 0) {
    suggestions.push('Check the weather forecast for packing')
  }
  
  return suggestions
}

function generateImprovementSuggestions(
  trip: Trip, 
  analysis: TripAnalysis
): string[] {
  const suggestions: string[] = []
  
  // Check for optimization opportunities
  const activities = trip.itinerary?.flatMap(day => day.activities || []) || []
  const hasLongDays = trip.itinerary?.some(day => 
    (day.activities?.length || 0) > 5
  )
  
  if (hasLongDays) {
    suggestions.push('Some days look packed. Consider a more relaxed pace')
  }
  
  // Budget optimization
  if (trip.budget && analysis.stats.budgetUsed > trip.budget.total * 0.9) {
    suggestions.push('You\'re close to budget. I can suggest free activities')
  }
  
  return suggestions
}