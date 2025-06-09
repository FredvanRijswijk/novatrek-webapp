# Firebase Reference Fields Migration Guide

This guide explains how to implement Firebase DocumentReference fields throughout the NovaTrek application for better performance, type safety, and data integrity.

## Overview

We're migrating from string-based relationship IDs to Firebase DocumentReference fields while maintaining backward compatibility. This allows gradual migration without breaking existing functionality.

## Key Benefits

1. **Atomic Operations**: Update related documents in transactions
2. **Type Safety**: `DocumentReference<T>` ensures correct types
3. **Better Security Rules**: Follow references without extra reads
4. **Query Performance**: More efficient joins and lookups
5. **Data Integrity**: References ensure related documents exist

## Migration Strategy

### Phase 1: Dual-Write Pattern (Current)
Write both string IDs and references for new documents:
```typescript
// When creating a trip
{
  userId: "user123",          // Legacy field
  userRef: doc(db, 'users', 'user123')  // New reference field
}
```

### Phase 2: Dual-Read Pattern
Query both patterns to support all data:
```typescript
// Query trips by user
const [refTrips, stringTrips] = await Promise.all([
  query(where('userRef', '==', userRef)),
  query(where('userId', '==', userId))
])
```

### Phase 3: Migrate Existing Data
Run migration scripts to add references to existing documents:
```bash
npm run migrate:references --all-trips
```

## Implementation Examples

### 1. Enhanced Trip Model
```typescript
import { TripModelEnhanced } from '@/lib/models/trip-enhanced'

// Create trip with reference
const tripId = await TripModelEnhanced.create({
  title: "European Adventure",
  userId: currentUser.uid,  // Both fields are set automatically
  // ... other fields
})

// Query trips (works with both patterns)
const trips = await TripModelEnhanced.getUserTrips(currentUser.uid)
```

### 2. Enhanced Marketplace Model
```typescript
import { MarketplaceModelEnhanced } from '@/lib/models/marketplace-enhanced'

// Create product with expert reference
const productId = await MarketplaceModelEnhanced.createProduct({
  title: "City Tour Guide",
  expertId: expertId,  // expertRef is added automatically
  price: 150,
  // ... other fields
})

// Query products (hybrid approach)
const products = await MarketplaceModelEnhanced.getProductsByExpert(expertId)
```

### 3. Enhanced Chat Model
```typescript
import { ChatModelEnhanced } from '@/lib/models/chat-enhanced'

// Create message with references
const messageId = await ChatModelEnhanced.createMessage({
  userId: currentUser.uid,
  tripId: tripId,
  message: "What activities do you recommend?",
  role: 'user'
})

// Subscribe to messages (handles both patterns)
const unsubscribe = ChatModelEnhanced.subscribeToTripMessages(
  tripId,
  (messages) => setMessages(messages)
)
```

## Using Enhanced Hooks

### Trip Hooks
```typescript
import { useUserTrips, useTripWithUser } from '@/hooks/use-trips-hybrid'

// Get user's trips
const { trips, loading, error } = useUserTrips({
  userId: currentUser?.uid,
  realtime: true
})

// Get trip with populated user data
const { trip, user, loading } = useTripWithUser(tripId)
```

### Marketplace Hooks
```typescript
import { useMarketplaceProducts, useProductWithExpert } from '@/hooks/use-marketplace-hybrid'

// Get expert's products
const { products, loading } = useMarketplaceProducts({
  expertId: expertId,
  realtime: true
})

// Get product with expert data
const { product, expert } = useProductWithExpert(productId)
```

## Security Rules Update

Deploy the enhanced security rules that support both patterns:

```bash
# Deploy reference-aware rules
firebase deploy --only firestore:rules --rules firestore-reference-poc.rules
```

Example rule supporting both patterns:
```javascript
match /trips/{tripId} {
  allow read: if request.auth != null && (
    // Legacy: String userId
    request.auth.uid == resource.data.userId ||
    // New: User reference
    resource.data.userRef == /databases/$(database)/documents/users/$(request.auth.uid)
  );
}
```

## Migration Checklist

### For New Features
- [ ] Use enhanced models (trip-enhanced, marketplace-enhanced, etc.)
- [ ] Ensure both string IDs and references are written
- [ ] Use hybrid hooks for querying
- [ ] Test with both old and new data

### For Existing Features
- [ ] Identify components using direct Firestore queries
- [ ] Replace with enhanced models or hybrid hooks
- [ ] Test thoroughly with mixed data
- [ ] Run migration script for that collection

### Before Production
- [ ] Deploy updated security rules
- [ ] Run migration scripts in staging
- [ ] Monitor performance metrics
- [ ] Have rollback plan ready

## Common Patterns

### 1. Creating Documents with References
```typescript
// Always include both fields for backward compatibility
const docData = {
  userId: currentUser.uid,
  userRef: doc(db, 'users', currentUser.uid),
  // ... other fields
}
```

### 2. Querying with Both Patterns
```typescript
// Use Promise.all for parallel queries
const [refResults, stringResults] = await Promise.all([
  query(where('userRef', '==', userRef)),
  query(where('userId', '==', userId))
])

// Deduplicate results
const resultMap = new Map()
[...refResults, ...stringResults].forEach(doc => {
  resultMap.set(doc.id, doc)
})
```

### 3. Atomic Updates with References
```typescript
// Update related documents in a transaction
await runTransaction(db, async (transaction) => {
  const productRef = doc(db, 'products', productId)
  const expertRef = doc(db, 'experts', expertId)
  
  const product = await transaction.get(productRef)
  const expert = await transaction.get(expertRef)
  
  // Update both atomically
  transaction.update(productRef, { sold: true })
  transaction.update(expertRef, { 
    totalSales: expert.data().totalSales + 1 
  })
})
```

## Performance Considerations

1. **Initial Migration**: Expect increased reads during dual-query phase
2. **Long-term Benefits**: Fewer reads once fully migrated
3. **Index Requirements**: May need composite indexes for reference queries
4. **Batch Operations**: Use batched writes for bulk updates

## Troubleshooting

### Common Issues

1. **"Cannot read property 'id' of undefined"**
   - Ensure document exists before creating reference
   - Check both query results when deduplicating

2. **Security rule denials**
   - Deploy updated rules supporting both patterns
   - Verify reference paths match exactly

3. **Missing data in queries**
   - Ensure querying both patterns
   - Check deduplication logic

### Debug Helpers

```typescript
// Log both query results
console.log('Ref query results:', refResults.length)
console.log('String query results:', stringResults.length)
console.log('Deduped results:', resultMap.size)
```

## Next Steps

1. **Immediate**: Start using enhanced models for new features
2. **Short-term**: Migrate high-traffic collections (trips, products)
3. **Medium-term**: Update all create/update operations
4. **Long-term**: Remove string ID fallbacks after full migration

## Resources

- [Firebase DocumentReference Docs](https://firebase.google.com/docs/firestore/manage-data/data-types#reference)
- [Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-reference)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

## Migration Status Tracking

Run this command to check migration progress:
```bash
npm run migrate:references -- --verify
```

This will show:
- Collections with both patterns
- Documents missing references
- Invalid references that need cleanup