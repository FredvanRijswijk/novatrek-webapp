# Firebase Reference Fields Proof of Concept

This POC demonstrates how to implement and migrate to Firebase DocumentReference fields while maintaining backward compatibility with existing string-based IDs.

## Overview

Firebase reference fields provide several advantages over string IDs:
- **Type safety**: References are strongly typed
- **Atomic operations**: Can follow references in transactions
- **Better security rules**: Can traverse references in rules without additional reads
- **Data integrity**: References ensure related documents exist

## Implementation Structure

### 1. New Model with References
`lib/models/marketplace-reference.ts`
- Defines interfaces with both string IDs (legacy) and reference fields (new)
- Implements hybrid queries that work with both patterns
- Provides migration utilities

### 2. Hybrid React Hooks
`hooks/use-marketplace-hybrid.ts`
- `useMarketplaceProducts`: Queries products using both patterns
- `useProductWithExpert`: Fetches product with populated expert data
- `useExpertProductReviews`: Advanced aggregation across collections

### 3. Migration Script
`scripts/migrate-to-references.ts`
```bash
# Dry run to see what would be migrated
npm run migrate:references -- --dry-run

# Run actual migration
npm run migrate:references

# Verify migration status
npm run migrate:references -- --verify

# Migrate only specific collections
npm run migrate:references -- --products
npm run migrate:references -- --transactions
```

### 4. Security Rules
`firestore-reference-poc.rules`
- Supports both legacy string IDs and new references
- Helper functions for reference validation
- Examples of following references in rules

## Usage Examples

### Creating Products with References

```typescript
import { MarketplaceReferenceModel } from '@/lib/models/marketplace-reference'

// Create a product with expert reference
const product = await MarketplaceReferenceModel.createProductWithReference({
  title: 'Guided City Tour',
  description: 'Personalized tour of hidden gems',
  price: 150,
  expertId: 'expert123', // Keep for backward compatibility
  category: 'experiences',
  images: [],
  isActive: true
}, 'expert123')
```

### Using Hybrid Hooks

```typescript
import { useMarketplaceProducts, useProductWithExpert } from '@/hooks/use-marketplace-hybrid'

// In a React component
function ExpertProducts({ expertId }: { expertId: string }) {
  // This works with both old and new data
  const { products, loading, error } = useMarketplaceProducts({
    expertId,
    realtime: true, // Optional: real-time updates
    includeInactive: false
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Get product with expert data
function ProductDetail({ productId }: { productId: string }) {
  const { product, expert, loading } = useProductWithExpert(productId)
  
  if (loading) return <div>Loading...</div>
  if (!product) return <div>Product not found</div>

  return (
    <div>
      <h1>{product.title}</h1>
      {expert && <p>by {expert.businessName}</p>}
    </div>
  )
}
```

### Atomic Transactions with References

```typescript
// Purchase a product - automatically updates expert stats
const result = await MarketplaceReferenceModel.purchaseProductWithReference(
  'product123',
  'buyer456', 
  'pi_stripe_intent_id'
)
// Returns { product, expert, transactionId }
```

## Migration Strategy

### Phase 1: Preparation (Current)
1. ✅ Create new models supporting both patterns
2. ✅ Implement hybrid queries
3. ✅ Update security rules to support both
4. ✅ Create migration utilities

### Phase 2: Gradual Migration
1. Deploy new code that reads both patterns
2. Run migration script in batches
3. Monitor for issues
4. Verify data integrity

### Phase 3: Cleanup (Future)
1. Remove string ID fallbacks from queries
2. Update all write operations to use references
3. Clean up legacy fields from documents
4. Simplify security rules

## Key Benefits Demonstrated

### 1. Improved Query Performance
```typescript
// Before: Multiple queries needed
const expert = await getExpert(expertId)
const products = await getProductsByExpert(expertId)
for (const product of products) {
  const reviews = await getReviewsByProduct(product.id)
}

// After: Can use references in transactions/batch operations
const result = await purchaseProductWithReference(productId, buyerId, paymentId)
// Atomically updates product, expert stats, and creates transaction
```

### 2. Better Security Rules
```javascript
// Before: Additional read required
allow read: if get(/databases/$(database)/documents/marketplace_experts/$(resource.data.expertId)).data.userId == request.auth.uid;

// After: Direct reference traversal
allow read: if userOwnsExpert(request.auth.uid, resource.data.expertRef);
```

### 3. Type Safety
```typescript
// Before
expertId: string // Could be any string

// After  
expertRef: DocumentReference<MarketplaceExpertRef> // Type-safe
```

## Testing the POC

1. **Test Hybrid Queries**: The hooks automatically query both patterns
2. **Test Migration**: Use --dry-run flag first
3. **Test Security Rules**: Deploy `firestore-reference-poc.rules` to test environment
4. **Monitor Performance**: Compare query times before/after

## Rollback Plan

If issues arise:
1. The hybrid approach allows instant rollback
2. No data is deleted during migration
3. Both patterns coexist indefinitely if needed

## Next Steps

1. Test migration script on development data
2. Performance test hybrid queries vs. legacy queries  
3. Plan phased rollout starting with new features
4. Document team conventions for using references

## Notes

- Migration script requires Firebase Admin SDK
- Always backup data before running migrations
- Consider index requirements for reference queries
- Monitor Firestore costs during migration (additional reads)

## Package.json Script

Add to package.json:
```json
"scripts": {
  "migrate:references": "ts-node scripts/migrate-to-references.ts"
}
```