# Google Places API Migration Guide

## Overview
Google is deprecating the `AutocompleteService` API for new customers as of March 1st, 2025. We've migrated to the new `AutocompleteSuggestion` API.

## Changes Made

### 1. Updated GooglePlacesClientV2
- Removed `AutocompleteService` dependency
- Migrated to `AutocompleteSuggestion.fetchAutocompleteSuggestions()`
- Updated initialization to use async/await pattern

### 2. Key API Differences

#### Old API (Deprecated)
```typescript
this.autocompleteService.getPlacePredictions({
  input,
  types: ['(cities)'],
  sessionToken: this.sessionToken,
}, callback);
```

#### New API (Current)
```typescript
const suggestions = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
  input,
  includedPrimaryTypes: ['locality', 'administrative_area_level_1', 'country'],
  sessionToken: this.sessionToken,
});
```

## Benefits of New API

1. **Promise-based**: No more callbacks, cleaner async/await code
2. **Better typing**: Improved TypeScript support
3. **More control**: Fine-grained control over suggestion types
4. **Future-proof**: Aligned with Google's latest Places API

## Migration Checklist

- [x] Update `client-v2.ts` to use new API
- [x] Maintain backward compatibility for return types
- [ ] Remove legacy `client.ts` (if no longer needed)
- [ ] Update any direct Google Maps script loading to ensure latest version

## Testing

After migration, test:
1. Destination search in trip creation wizard
2. Place autocomplete in various forms
3. Session token renewal after place selection
4. Error handling for failed requests

## Notes

- The warning will disappear once the new API is fully integrated
- Existing functionality remains unchanged from user perspective
- Session tokens continue to work the same way