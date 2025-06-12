import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { TravelPreferences } from '@/types/preferences';

const aggregatePreferencesParams = z.object({
  groupMemberIds: z.array(z.string()).optional(),
  aggregationMode: z.enum(['consensus', 'inclusive', 'democratic']).default('inclusive'),
  conflictResolution: z.enum(['accommodate_all', 'majority_wins', 'find_middle_ground']).default('accommodate_all')
});

interface PreferenceConflict {
  category: string;
  field: string;
  values: Array<{ userId: string; value: any }>;
  severity: 'low' | 'medium' | 'high';
  resolution: string;
}

interface AggregatedPreferences extends Partial<TravelPreferences> {
  groupSize: number;
  conflicts: PreferenceConflict[];
  compromises: string[];
  recommendations: string[];
}

export const aggregatePreferencesTool: TravelTool<z.infer<typeof aggregatePreferencesParams>, AggregatedPreferences> = {
  id: 'aggregate_preferences',
  name: 'Aggregate Group Travel Preferences',
  description: 'Intelligently combines travel preferences from multiple group members to find options that work for everyone',
  category: 'planning',
  parameters: aggregatePreferencesParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const { groupMemberIds, aggregationMode, conflictResolution } = params;
      
      // For now, we'll simulate group preferences
      // In production, this would fetch preferences for each group member
      const groupPreferences = await fetchGroupPreferences(groupMemberIds || [], context);
      
      if (groupPreferences.length === 0) {
        return {
          success: false,
          error: 'No group member preferences found'
        };
      }
      
      // Aggregate preferences based on mode
      const aggregated = aggregateByMode(groupPreferences, aggregationMode);
      
      // Identify and resolve conflicts
      const conflicts = identifyConflicts(groupPreferences);
      const resolvedPreferences = resolveConflicts(
        aggregated,
        conflicts,
        conflictResolution,
        groupPreferences
      );
      
      // Generate compromises and recommendations
      const compromises = generateCompromises(conflicts, resolvedPreferences);
      const recommendations = generateGroupRecommendations(
        resolvedPreferences,
        conflicts,
        groupPreferences.length
      );
      
      return {
        success: true,
        data: {
          ...resolvedPreferences,
          groupSize: groupPreferences.length,
          conflicts,
          compromises,
          recommendations
        },
        metadata: {
          confidence: calculateConfidence(conflicts),
          source: 'group-preference-aggregator'
        }
      };
      
    } catch (error) {
      console.error('Aggregate preferences error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to aggregate preferences'
      };
    }
  }
};

async function fetchGroupPreferences(
  memberIds: string[],
  context: ToolContext
): Promise<TravelPreferences[]> {
  // In production, fetch from database
  // For now, simulate with variations of current user preferences
  const basePrefs = context.preferences || {};
  
  if (memberIds.length === 0) {
    // Simulate a group of 3 with different preferences
    return [
      basePrefs as TravelPreferences,
      generateVariation(basePrefs, 'adventurous'),
      generateVariation(basePrefs, 'relaxed'),
      generateVariation(basePrefs, 'budget-conscious')
    ].filter(Boolean);
  }
  
  // In real implementation:
  // const prefs = await Promise.all(
  //   memberIds.map(id => getAdminDb().collection('travelPreferences').doc(id).get())
  // );
  // return prefs.map(doc => doc.data()).filter(Boolean);
  
  return [basePrefs as TravelPreferences];
}

function generateVariation(
  base: Partial<TravelPreferences>,
  persona: 'adventurous' | 'relaxed' | 'budget-conscious'
): TravelPreferences {
  const variations = {
    adventurous: {
      travelStyle: ['adventure', 'cultural', 'off-the-beaten-path'] as any,
      activityLevel: 'high' as any,
      preferredActivities: ['hiking', 'extreme-sports', 'local-experiences'] as any,
      budget: 'flexible' as any,
      accommodationType: ['hostel', 'unique-stays'] as any,
      dietary: base.dietary || [],
      interests: ['nature', 'sports', 'photography'] as any,
      accessibility: []
    },
    relaxed: {
      travelStyle: ['relaxation', 'luxury', 'wellness'] as any,
      activityLevel: 'low' as any,
      preferredActivities: ['spa', 'beach', 'fine-dining'] as any,
      budget: 'luxury' as any,
      accommodationType: ['hotel', 'resort'] as any,
      dietary: [...(base.dietary || []), 'gluten-free'] as any,
      interests: ['food', 'wellness', 'shopping'] as any,
      accessibility: []
    },
    'budget-conscious': {
      travelStyle: ['budget', 'backpacking', 'cultural'] as any,
      activityLevel: 'moderate' as any,
      preferredActivities: ['free-activities', 'local-markets', 'walking-tours'] as any,
      budget: 'budget' as any,
      accommodationType: ['hostel', 'airbnb'] as any,
      dietary: base.dietary || [],
      interests: ['history', 'local-culture', 'street-food'] as any,
      accessibility: []
    }
  };
  
  return {
    ...base,
    ...variations[persona]
  } as TravelPreferences;
}

function aggregateByMode(
  preferences: TravelPreferences[],
  mode: 'consensus' | 'inclusive' | 'democratic'
): Partial<TravelPreferences> {
  const aggregated: Partial<TravelPreferences> = {};
  
  switch (mode) {
    case 'inclusive':
      // Include all preferences from all members
      aggregated.dietary = Array.from(new Set(
        preferences.flatMap(p => p.dietary || [])
      ));
      aggregated.accessibility = Array.from(new Set(
        preferences.flatMap(p => p.accessibility || [])
      ));
      aggregated.interests = Array.from(new Set(
        preferences.flatMap(p => p.interests || [])
      ));
      aggregated.preferredActivities = Array.from(new Set(
        preferences.flatMap(p => p.preferredActivities || [])
      ));
      aggregated.travelStyle = findCommonElements(
        preferences.map(p => p.travelStyle || [])
      );
      break;
      
    case 'consensus':
      // Only include preferences everyone agrees on
      aggregated.dietary = findCommonElements(
        preferences.map(p => p.dietary || [])
      );
      aggregated.interests = findCommonElements(
        preferences.map(p => p.interests || [])
      );
      break;
      
    case 'democratic':
      // Majority rules
      aggregated.activityLevel = findMostCommon(
        preferences.map(p => p.activityLevel).filter(Boolean)
      );
      aggregated.budget = findMostCommon(
        preferences.map(p => p.budget).filter(Boolean)
      );
      break;
  }
  
  return aggregated;
}

function identifyConflicts(preferences: TravelPreferences[]): PreferenceConflict[] {
  const conflicts: PreferenceConflict[] = [];
  
  // Check budget conflicts
  const budgets = preferences.map((p, i) => ({ 
    userId: `member-${i}`, 
    value: p.budget 
  })).filter(b => b.value);
  
  if (hasBudgetConflict(budgets.map(b => b.value))) {
    conflicts.push({
      category: 'budget',
      field: 'budget',
      values: budgets,
      severity: 'high',
      resolution: 'Find activities within lowest budget range'
    });
  }
  
  // Check activity level conflicts
  const activityLevels = preferences.map((p, i) => ({ 
    userId: `member-${i}`, 
    value: p.activityLevel 
  })).filter(a => a.value);
  
  if (hasActivityLevelConflict(activityLevels.map(a => a.value))) {
    conflicts.push({
      category: 'activity',
      field: 'activityLevel',
      values: activityLevels,
      severity: 'medium',
      resolution: 'Mix high and low energy activities throughout the day'
    });
  }
  
  // Check dietary conflicts (not really conflicts, but important to track)
  const dietaryNeeds = preferences.flatMap(p => p.dietary || []);
  if (dietaryNeeds.length > 0) {
    const uniqueDietary = Array.from(new Set(dietaryNeeds));
    if (uniqueDietary.some(d => ['vegan', 'vegetarian', 'halal', 'kosher'].includes(d))) {
      conflicts.push({
        category: 'dietary',
        field: 'dietary',
        values: preferences.map((p, i) => ({ 
          userId: `member-${i}`, 
          value: p.dietary 
        })),
        severity: 'high',
        resolution: 'All restaurants must accommodate these dietary requirements'
      });
    }
  }
  
  // Check travel style conflicts
  const styles = preferences.map(p => p.travelStyle || []);
  if (hasTravelStyleConflict(styles)) {
    conflicts.push({
      category: 'style',
      field: 'travelStyle',
      values: preferences.map((p, i) => ({ 
        userId: `member-${i}`, 
        value: p.travelStyle 
      })),
      severity: 'low',
      resolution: 'Create a balanced itinerary with different activity types'
    });
  }
  
  return conflicts;
}

function resolveConflicts(
  aggregated: Partial<TravelPreferences>,
  conflicts: PreferenceConflict[],
  resolution: 'accommodate_all' | 'majority_wins' | 'find_middle_ground',
  originalPrefs: TravelPreferences[]
): Partial<TravelPreferences> {
  const resolved = { ...aggregated };
  
  for (const conflict of conflicts) {
    switch (conflict.field) {
      case 'budget':
        if (resolution === 'accommodate_all') {
          // Use the most restrictive budget
          resolved.budget = 'budget'; // Default to lowest
        } else if (resolution === 'find_middle_ground') {
          resolved.budget = 'moderate';
        }
        break;
        
      case 'activityLevel':
        if (resolution === 'find_middle_ground') {
          resolved.activityLevel = 'moderate';
        } else if (resolution === 'accommodate_all') {
          // Plan for mixed activity levels
          resolved.mixedActivityLevels = true as any;
        }
        break;
        
      case 'dietary':
        // Always accommodate all dietary restrictions
        resolved.dietary = Array.from(new Set(
          originalPrefs.flatMap(p => p.dietary || [])
        ));
        break;
    }
  }
  
  return resolved;
}

function generateCompromises(
  conflicts: PreferenceConflict[],
  resolved: Partial<TravelPreferences>
): string[] {
  const compromises: string[] = [];
  
  for (const conflict of conflicts) {
    switch (conflict.field) {
      case 'budget':
        compromises.push(
          'Mix budget-friendly and splurge activities. Consider group discounts and shared accommodations.'
        );
        break;
        
      case 'activityLevel':
        compromises.push(
          'Schedule high-energy activities in the morning with relaxation time in the afternoon. Offer optional activities.'
        );
        break;
        
      case 'travelStyle':
        compromises.push(
          'Alternate between different travel styles each day - adventure one day, relaxation the next.'
        );
        break;
    }
  }
  
  // Add general group travel tips
  compromises.push(
    'Build in free time for individual exploration',
    'Choose restaurants with diverse menus to satisfy all preferences',
    'Book accommodations with common areas for group bonding'
  );
  
  return compromises;
}

function generateGroupRecommendations(
  preferences: Partial<TravelPreferences>,
  conflicts: PreferenceConflict[],
  groupSize: number
): string[] {
  const recommendations: string[] = [];
  
  // Size-based recommendations
  if (groupSize > 6) {
    recommendations.push(
      'Consider splitting into smaller groups for some activities',
      'Book restaurants well in advance for large group seating',
      'Look for group tour discounts'
    );
  }
  
  // Conflict-based recommendations
  if (conflicts.some(c => c.field === 'budget' && c.severity === 'high')) {
    recommendations.push(
      'Research free walking tours and public spaces',
      'Plan picnics or market visits for budget-friendly group meals',
      'Use apartment rentals with kitchens to save on dining costs'
    );
  }
  
  if (conflicts.some(c => c.field === 'activityLevel')) {
    recommendations.push(
      'Choose activities with varying participation levels',
      'Book accommodations near public transport for easy solo exploration',
      'Plan rest days between intensive activities'
    );
  }
  
  // Dietary recommendations
  if (preferences.dietary && preferences.dietary.length > 2) {
    recommendations.push(
      'Focus on restaurants known for accommodating dietary restrictions',
      'Consider food markets where everyone can choose their own meals',
      'Research restaurants in advance and call ahead about dietary needs'
    );
  }
  
  return recommendations;
}

// Helper functions
function findCommonElements(arrays: string[][]): string[] {
  if (arrays.length === 0) return [];
  return arrays[0].filter(item => 
    arrays.every(array => array.includes(item))
  );
}

function findMostCommon<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  
  const counts = new Map<T, number>();
  items.forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });
  
  let maxCount = 0;
  let mostCommon: T | undefined;
  
  counts.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  });
  
  return mostCommon;
}

function hasBudgetConflict(budgets: any[]): boolean {
  const uniqueBudgets = Array.from(new Set(budgets));
  return uniqueBudgets.includes('budget') && uniqueBudgets.includes('luxury');
}

function hasActivityLevelConflict(levels: any[]): boolean {
  const uniqueLevels = Array.from(new Set(levels));
  return uniqueLevels.includes('low') && uniqueLevels.includes('high');
}

function hasTravelStyleConflict(styles: string[][]): boolean {
  const allStyles = styles.flat();
  return allStyles.includes('adventure') && allStyles.includes('relaxation');
}

function calculateConfidence(conflicts: PreferenceConflict[]): number {
  const highConflicts = conflicts.filter(c => c.severity === 'high').length;
  const totalConflicts = conflicts.length;
  
  if (totalConflicts === 0) return 1;
  if (highConflicts > 2) return 0.6;
  if (highConflicts > 0) return 0.8;
  return 0.9;
}