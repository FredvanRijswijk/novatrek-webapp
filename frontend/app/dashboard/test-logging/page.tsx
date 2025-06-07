'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { useLogger } from '@/lib/logging/LoggerProvider'
import { LogLevel, LogCategory } from '@/lib/logging/logger'
import { 
  Bug, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  Zap,
  CheckCircle
} from 'lucide-react'

export default function TestLoggingPage() {
  const { handleError, logAction, logPerformance } = useErrorHandler()
  const logger = useLogger()
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testLogLevel = async (level: LogLevel, category: LogCategory) => {
    try {
      const message = `Test ${level} log from testing page`
      
      switch (level) {
        case 'debug':
          await logger.debug(category, message, { test: true })
          break
        case 'info':
          await logger.info(category, message, { test: true })
          break
        case 'warn':
          await logger.warn(category, message, { test: true })
          break
        case 'error':
          await logger.error(category, message, new Error('Test error'), { test: true })
          break
        case 'critical':
          await logger.critical(category, message, new Error('Test critical error'), { test: true })
          break
      }
      
      addResult(`✅ ${level.toUpperCase()} log sent successfully`)
    } catch (error) {
      addResult(`❌ Failed to send ${level} log: ${error}`)
    }
  }

  const testUserAction = async () => {
    try {
      await logAction('test_button_clicked', 'general', {
        page: 'test-logging',
        timestamp: new Date().toISOString()
      })
      addResult('✅ User action logged successfully')
    } catch (error) {
      addResult(`❌ Failed to log user action: ${error}`)
    }
  }

  const testPerformance = async () => {
    try {
      const duration = Math.floor(Math.random() * 5000) + 500
      await logPerformance('test_operation', duration)
      addResult(`✅ Performance log sent (${duration}ms)`)
    } catch (error) {
      addResult(`❌ Failed to log performance: ${error}`)
    }
  }

  const testApiError = async () => {
    try {
      await logger.logApiError('/api/test', new Error('Test API error'), {
        method: 'POST',
        body: { test: true }
      })
      addResult('✅ API error logged successfully')
    } catch (error) {
      addResult(`❌ Failed to log API error: ${error}`)
    }
  }

  const testStripeError = async () => {
    try {
      const error = new Error('Test Stripe error') as any
      error.code = 'card_declined'
      error.type = 'card_error'
      
      await logger.logStripeError('test_payment', error, {
        amount: 1000,
        currency: 'usd'
      })
      addResult('✅ Stripe error logged successfully')
    } catch (error) {
      addResult(`❌ Failed to log Stripe error: ${error}`)
    }
  }

  const testFirebaseError = async () => {
    try {
      const error = new Error('Test Firebase error') as any
      error.code = 'permission-denied'
      
      await logger.logFirebaseError('test_read', error, 'users', 'test123')
      addResult('✅ Firebase error logged successfully')
    } catch (error) {
      addResult(`❌ Failed to log Firebase error: ${error}`)
    }
  }

  const testComponentError = () => {
    throw new Error('Test component error - this should be caught by ErrorBoundary')
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Logging System</h1>
        <p className="text-muted-foreground mt-2">
          Test different logging scenarios to ensure the system is working correctly
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Click the buttons below to test different logging scenarios. 
          Check the <a href="/dashboard/admin/logs" className="underline">System Logs</a> page to see the results.
        </AlertDescription>
      </Alert>

      {/* Log Level Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Test Log Levels</CardTitle>
          <CardDescription>
            Test each log level with different categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button 
              variant="outline" 
              onClick={() => testLogLevel('debug', 'general')}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testLogLevel('info', 'general')}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Info
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testLogLevel('warn', 'general')}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Warning
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testLogLevel('error', 'general')}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Error
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testLogLevel('critical', 'general')}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Critical
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Specific Error Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Test Specific Error Types</CardTitle>
          <CardDescription>
            Test logging for different parts of the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button variant="outline" onClick={testApiError}>
              Test API Error
            </Button>
            <Button variant="outline" onClick={testStripeError}>
              Test Stripe Error
            </Button>
            <Button variant="outline" onClick={testFirebaseError}>
              Test Firebase Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Other Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Other Logging Tests</CardTitle>
          <CardDescription>
            Test user actions, performance, and error boundaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button variant="outline" onClick={testUserAction}>
              <Zap className="mr-2 h-4 w-4" />
              Test User Action
            </Button>
            <Button variant="outline" onClick={testPerformance}>
              Test Performance Log
            </Button>
            <Button 
              variant="destructive" 
              onClick={testComponentError}
            >
              Trigger React Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Results of your logging tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No tests run yet. Click the buttons above to start testing.
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="text-sm font-mono p-2 bg-muted rounded flex items-center gap-2"
                >
                  {result.includes('✅') ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className={result.includes('❌') ? 'text-red-600' : ''}>
                    {result.replace(/[✅❌]/g, '').trim()}
                  </span>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearResults}
                className="mt-2"
              >
                Clear Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="flex gap-4">
        <Button asChild>
          <a href="/dashboard/admin/logs" target="_blank">
            View System Logs
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/admin/marketplace" target="_blank">
            Admin Dashboard
          </a>
        </Button>
      </div>
    </div>
  )
}