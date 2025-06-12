# Firestore Subcollection Refactoring Plan

## Overview
This document outlines the plan to refactor the current nested array structure to use Firestore subcollections for better scalability, performance, and flexibility.

## Current vs. New Structure

### Current Structure (Nested Arrays)
```
trips/{tripId}
  ├── itinerary: [
  │     {
  │       id: "day-1",
  │       activities: [...],
  │       accommodations: [...],
  │       transportation: [...]
  │     }
  │   ]
```

### New Structure (Subcollections)
```
trips/{tripId}
  ├── Core trip data (lean document)
  │
  ├── days/{dayId}
  │     ├── Day metadata (date, notes, etc.)
  │     │
  │     ├── activities/{activityId}
  │     │     └── Activity details
  │     │
  │     ├── accommodations/{accommodationId}
  │     │     └── Accommodation details
  │     │
  │     └── transportation/{transportId}
  │           └── Transportation details
  │
  ├── expenses/{expenseId}
  │     └── Expense details
  │
  └── ai_recommendations/{recommendationId}
        └── AI recommendation details
```

## Implementation Phases

### Phase 1: Data Models and Types
1. Create new TypeScript interfaces for subcollection structure
2. Create new model classes for each subcollection
3. Update existing types to support both structures during migration

### Phase 2: Database Access Layer
1. Create new TripModelV2 with subcollection support
2. Implement CRUD operations for days subcollection
3. Implement CRUD operations for activities, accommodations, transportation
4. Add batch operations for efficient multi-document updates

### Phase 3: Migration Utilities
1. Create backup utility to export current data
2. Create migration script to convert nested arrays to subcollections
3. Create verification utility to ensure data integrity
4. Create rollback utility in case of issues

### Phase 4: Application Updates
1. Update AI tools to use subcollection structure
2. Update UI components progressively
3. Implement feature flag to switch between old/new structure
4. Update real-time subscriptions for subcollections

### Phase 5: Security and Optimization
1. Update Firestore security rules for subcollections
2. Implement efficient batched reads for trip overview
3. Add caching layer for frequently accessed data
4. Optimize queries with composite indexes

## Benefits of New Structure

### Performance
- **Granular Updates**: Update single activities without rewriting entire arrays
- **Concurrent Writes**: Multiple users/processes can update different items
- **Efficient Queries**: Use Collection Group queries for cross-trip searches
- **Reduced Bandwidth**: Only fetch/update what's needed

### Scalability
- **No Document Size Limits**: Spread data across many small documents
- **Unlimited Growth**: Add thousands of activities without issues
- **Better Indexing**: Firestore can index subcollection fields

### Flexibility
- **Easier Filtering**: Query activities by type, date, or status
- **Simpler Sharing**: Share specific days or activities
- **Version History**: Track changes to individual items
- **Rich Metadata**: Add more fields without bloating main document

## Data Access Patterns

### Reading a Full Trip
```typescript
// 1. Get trip document
const trip = await getDoc(doc(db, 'trips', tripId));

// 2. Get all days
const days = await getDocs(collection(db, 'trips', tripId, 'days'));

// 3. For each day, get activities (can be done in parallel)
const dayActivities = await Promise.all(
  days.docs.map(day => 
    getDocs(collection(db, 'trips', tripId, 'days', day.id, 'activities'))
  )
);
```

### Adding an Activity
```typescript
// Direct write to specific subcollection
await addDoc(
  collection(db, 'trips', tripId, 'days', dayId, 'activities'),
  activityData
);
```

### Querying Across Trips
```typescript
// Find all expert-recommended activities
const activities = await getDocs(
  query(
    collectionGroup(db, 'activities'),
    where('expertRecommended', '==', true),
    where('userId', '==', currentUserId)
  )
);
```

## Migration Strategy

### Step 1: Dual-Write Period
- New code writes to both structures
- Allows gradual migration without breaking existing features
- Can compare both structures for consistency

### Step 2: Progressive UI Migration
- Start with less critical features
- Use feature flags to control rollout
- Monitor performance improvements

### Step 3: Background Migration
- Run migration script for existing trips
- Process in batches to avoid overwhelming the system
- Verify data integrity after each batch

### Step 4: Cutover
- Switch all reads to new structure
- Disable writes to old structure
- Clean up old data after verification period

## Risk Mitigation

1. **Data Loss Prevention**
   - Full backup before migration
   - Verification scripts to ensure data integrity
   - Keep old structure for 30 days after migration

2. **Performance Issues**
   - Monitor read/write patterns
   - Implement caching for common queries
   - Use batched operations where possible

3. **User Experience**
   - Feature flags for gradual rollout
   - Fallback to old structure if issues detected
   - Clear error handling and logging

## Success Metrics

- Reduction in average write latency (target: 50% improvement)
- Reduction in bandwidth usage (target: 30% reduction)
- Support for trips with 100+ activities without performance degradation
- Enable new features like activity search and filtering
- Zero data loss during migration

## Timeline

- **Week 1**: Data models and database layer
- **Week 2**: Migration utilities and testing
- **Week 3**: AI tools and core UI updates
- **Week 4**: Progressive rollout and monitoring
- **Week 5**: Complete migration and cleanup

## Next Steps

1. Create new data models (Phase 1)
2. Implement TripModelV2 with subcollection support
3. Create migration utilities
4. Update AI tools to use new structure
5. Progressively update UI components
6. Deploy with feature flags for testing