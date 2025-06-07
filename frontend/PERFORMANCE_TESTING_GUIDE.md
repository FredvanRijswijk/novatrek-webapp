# Performance Testing Guide for NovaTrek

## 1. React DevTools Profiler

### Setup
1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Click record → perform actions → stop recording

### What to Look For
- Components rendering unnecessarily
- Long render times (>16ms is problematic)
- Frequent re-renders of large components

### Quick Implementation
```typescript
// Add to any component to measure render time
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="TripList" onRender={onRenderCallback}>
  <YourComponent />
</Profiler>
```

## 2. Chrome DevTools Performance

### Steps
1. Open Chrome DevTools → Performance tab
2. Click record → perform slow actions → stop
3. Analyze the flame chart

### Key Metrics
- **FCP** (First Contentful Paint): Should be <1.8s
- **LCP** (Largest Contentful Paint): Should be <2.5s
- **TTI** (Time to Interactive): Should be <3.8s
- **Main Thread Blocking**: Look for long tasks >50ms

## 3. Firebase Performance Monitoring

### Quick Setup
```bash
npm install firebase@latest
```

```typescript
// lib/firebase/performance.ts
import { getPerformance } from 'firebase/performance';
import { app } from './config';

const perf = getPerformance(app);

// Custom trace example
export function traceFirestoreQuery(name: string) {
  const trace = perf.trace(name);
  trace.start();
  return {
    stop: () => trace.stop(),
    incrementMetric: (metric: string, value: number) => 
      trace.incrementMetric(metric, value)
  };
}

// Usage in your models
const trace = traceFirestoreQuery('getTrips');
const trips = await getDocs(query(...));
trace.incrementMetric('tripCount', trips.size);
trace.stop();
```

## 4. Lighthouse CI

### Run Locally
```bash
# Install
npm install -g @lhci/cli

# Run on local build
npm run build
npm run start &
lhci autorun --collect.url=http://localhost:3000
```

## 5. Bundle Size Analysis

```bash
# Add to package.json
"analyze": "ANALYZE=true next build"

# Run
npm run analyze
```

## 6. Common Bottlenecks & Solutions

### Firebase/Firestore
```typescript
// ❌ Bad: Multiple sequential queries
const user = await getDoc(doc(db, 'users', userId));
const trips = await getDocs(collection(db, 'trips'));
const preferences = await getDoc(doc(db, 'preferences', userId));

// ✅ Good: Parallel queries
const [user, trips, preferences] = await Promise.all([
  getDoc(doc(db, 'users', userId)),
  getDocs(collection(db, 'trips')),
  getDoc(doc(db, 'preferences', userId))
]);
```

### React Rendering
```typescript
// ❌ Bad: Inline functions cause re-renders
<Button onClick={() => handleClick(id)}>Click</Button>

// ✅ Good: Memoized callbacks
const handleClick = useCallback((id) => {
  // handle click
}, []);

// ✅ Better: Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive render */}</div>
});
```

### Image Loading
```typescript
// ❌ Bad: Large unoptimized images
<img src="/huge-image.jpg" />

// ✅ Good: Next.js Image with optimization
import Image from 'next/image';
<Image 
  src="/image.jpg" 
  width={800} 
  height={600} 
  priority={isAboveFold}
  loading={isAboveFold ? "eager" : "lazy"}
/>
```

## 7. Performance Monitoring Dashboard

Create a simple performance monitor:

```typescript
// hooks/use-performance.ts
import { useEffect } from 'react';

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(`${componentName} took ${duration}ms to render`);
        
        // Send to your logging service
        logger.warn('performance', 'Slow component render', {
          component: componentName,
          duration,
          url: window.location.href
        });
      }
    };
  }, [componentName]);
}
```

## 8. Quick Performance Wins

### 1. Implement React.lazy for routes
```typescript
const Dashboard = lazy(() => import('./dashboard/page'));
const Marketplace = lazy(() => import('./marketplace/page'));
```

### 2. Add Firebase indexes
```bash
# Check Firestore console for missing index warnings
# Add to firestore.indexes.json
```

### 3. Enable Firestore offline persistence
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db).catch((err) => {
  console.log('Offline persistence failed:', err);
});
```

### 4. Implement virtual scrolling for long lists
```bash
npm install @tanstack/react-virtual
```

## 9. Performance Budget

Set targets in next.config.ts:
```typescript
module.exports = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  },
  // Monitor bundle size
  productionBrowserSourceMaps: false,
  compress: true,
}
```

## 10. Testing Script

Create a performance test script:
```bash
#!/bin/bash
# test-performance.sh

echo "🚀 Running performance tests..."

# 1. Build the app
npm run build

# 2. Run Lighthouse
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json

# 3. Check bundle size
npm run analyze

# 4. Run custom performance tests
npm run test:performance

echo "✅ Performance tests complete!"
```

## Key Metrics to Track

1. **Page Load Time**: <3s
2. **Time to Interactive**: <5s
3. **Firebase Query Time**: <500ms
4. **React Render Time**: <16ms per frame
5. **Bundle Size**: <300KB (gzipped)

## Emergency Performance Fixes

If users report slowness:
1. Check Firebase Usage tab for quota issues
2. Look for N+1 queries in Network tab
3. Profile with React DevTools
4. Check for memory leaks in Chrome Memory profiler
5. Verify CDN/image optimization is working