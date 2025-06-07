# Error Logging & Monitoring Guide

## Overview

We've implemented a comprehensive error logging system that captures errors, warnings, and important events throughout the NovaTrek application. This system helps us quickly identify and fix issues during testing and production.

## Features

### 1. Centralized Logger (`/lib/logging/logger.ts`)
- **Log Levels**: debug, info, warn, error, critical
- **Categories**: auth, subscription, marketplace, payment, api, firebase, stripe, ai, email, general
- **Automatic Context**: User ID, URL, user agent, session ID
- **Storage**: Firestore collection `logs`
- **Console Output**: In development mode

### 2. Error Boundary (`/components/error-boundary.tsx`)
- Catches React component errors
- Logs to centralized system with error ID
- Shows user-friendly error page
- Developer details in development mode

### 3. Admin Log Viewer (`/dashboard/admin/logs`)
- Real-time log viewing
- Filtering by level, category, time range
- Search functionality
- Export logs as JSON
- Detailed error stack traces

## Usage Examples

### Basic Logging

```typescript
import logger from '@/lib/logging/logger'

// Info logging
logger.info('subscription', 'User upgraded to Pro plan', {
  planId: 'pro',
  previousPlan: 'basic'
})

// Warning logging
logger.warn('payment', 'Payment retry attempted', {
  attemptNumber: 2,
  customerId: 'cus_xxx'
})

// Error logging
try {
  await someOperation()
} catch (error) {
  logger.error('api', 'Operation failed', error as Error, {
    operation: 'someOperation',
    userId: user.id
  })
}

// Critical logging (pages admins immediately)
logger.critical('payment', 'Payment system down', error, {
  affectedUsers: 100
})
```

### API Route Logging

```typescript
// In API routes
import logger from '@/lib/logging/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logger.info('api', 'Endpoint called', {
      endpoint: '/api/some-endpoint',
      method: 'POST'
    })
    
    // Your logic here
    
    // Log performance
    await logger.logPerformance('api', 'some-endpoint', Date.now() - startTime)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    await logger.logApiError('/api/some-endpoint', error as Error, {
      requestBody: await request.json()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Stripe Error Logging

```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({...})
} catch (error) {
  await logger.logStripeError('create_payment_intent', error as Error, {
    amount: 1000,
    currency: 'usd'
  })
}
```

### Firebase Error Logging

```typescript
try {
  await setDoc(doc(db, 'users', userId), data)
} catch (error) {
  await logger.logFirebaseError('setDoc', error as Error, 'users', userId)
}
```

### User Action Logging

```typescript
// Track important user actions
await logger.logUserAction('upgrade_subscription', 'subscription', {
  from: 'basic',
  to: 'pro',
  annual: true
})
```

## Error Categories

- **auth**: Authentication/authorization issues
- **subscription**: Subscription management errors
- **marketplace**: Marketplace operations (experts, products)
- **payment**: Payment processing (Stripe)
- **api**: API endpoint errors
- **firebase**: Database operations
- **stripe**: Stripe-specific errors
- **ai**: AI/ML service errors
- **email**: Email sending failures
- **general**: General application errors

## Monitoring Dashboard

Access the logs at: `/dashboard/admin/logs`

Features:
- Filter by log level (debug → critical)
- Filter by category
- Time range selection (1h, 24h, 7d, 30d)
- Search by message, user ID, or error
- Click any log for detailed view
- Export logs as JSON

## Best Practices

1. **Use Appropriate Log Levels**
   - `debug`: Detailed information for debugging
   - `info`: General information about app flow
   - `warn`: Something unexpected but handled
   - `error`: Error that needs attention
   - `critical`: System failure requiring immediate action

2. **Include Relevant Metadata**
   ```typescript
   logger.error('payment', 'Payment failed', error, {
     customerId: customer.id,
     amount: 5000,
     currency: 'usd',
     paymentMethodId: pm.id
   })
   ```

3. **Log User Actions**
   - Track important user flows
   - Include before/after states
   - Log decision points

4. **Performance Monitoring**
   ```typescript
   const start = Date.now()
   // ... operation ...
   await logger.logPerformance('api', 'heavy-operation', Date.now() - start)
   ```

5. **Error Recovery**
   ```typescript
   try {
     await primaryOperation()
   } catch (error) {
     logger.warn('api', 'Primary operation failed, trying fallback', error)
     try {
       await fallbackOperation()
       logger.info('api', 'Fallback succeeded')
     } catch (fallbackError) {
       logger.error('api', 'Both operations failed', fallbackError)
       throw fallbackError
     }
   }
   ```

## Testing Error Scenarios

1. **Force Errors in Development**
   ```typescript
   if (process.env.NODE_ENV === 'development' && forceError) {
     throw new Error('Test error for logging')
   }
   ```

2. **Test Different Log Levels**
   - Visit `/dashboard/admin/logs`
   - Try different operations
   - Check logs appear correctly

3. **Test Error Boundary**
   - Add a component that throws
   - Verify error logged with stack trace
   - Check user sees friendly error

## Production Considerations

1. **Log Retention**
   - Consider Firestore costs
   - Implement log rotation (30-90 days)
   - Archive critical logs

2. **Performance**
   - Logs are async (won't block)
   - Batch operations if needed
   - Monitor Firestore usage

3. **Security**
   - Never log sensitive data (passwords, full credit cards)
   - Sanitize user input
   - Use structured metadata

4. **Alerting** (Future)
   - Set up alerts for critical errors
   - Monitor error rates
   - Track performance degradation

## Common Error Patterns

### Authentication Errors
```typescript
logger.error('auth', 'Firebase auth error', error, {
  operation: 'signIn',
  method: authMethod,
  errorCode: error.code
})
```

### Payment Errors
```typescript
logger.error('payment', 'Stripe payment failed', error, {
  paymentIntentId: pi.id,
  amount: pi.amount,
  errorType: error.type,
  errorCode: error.code,
  declineCode: error.decline_code
})
```

### API Timeouts
```typescript
logger.error('api', 'Request timeout', new Error('Timeout'), {
  endpoint: url,
  timeout: 30000,
  method: 'GET'
})
```

## Integration with Error Reporting Services

The logger is designed to integrate with services like Sentry:

```typescript
// Future implementation in logger.ts
if (this.config.enableSentry && (level === 'error' || level === 'critical')) {
  Sentry.captureException(error, {
    level: level === 'critical' ? 'fatal' : 'error',
    tags: { category },
    extra: metadata
  })
}
```

## Debugging Tips

1. **Enable Debug Logs**
   - Set `minLevel: 'debug'` in logger config
   - Use debug logs liberally during development

2. **Correlation IDs**
   - Use session IDs to track user journey
   - Group related operations

3. **Structured Logging**
   - Always use metadata objects
   - Keep consistent field names
   - Use proper error objects

Remember: Good logging is crucial for maintaining a reliable application. When in doubt, log it!