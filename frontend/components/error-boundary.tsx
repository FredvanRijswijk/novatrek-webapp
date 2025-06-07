'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import logger from '@/lib/logging/logger'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Log to our centralized logger
    logger.critical('general', 'React Error Boundary Caught Error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      props: this.props,
      url: window.location.href,
      userAgent: window.navigator.userAgent
    })

    this.setState({
      error,
      errorInfo,
      errorId
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Error ID: <code>{this.state.errorId}</code>
                    </p>
                  )}
                  <p className="text-sm">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                </AlertDescription>
              </Alert>

              {isDevelopment && this.state.error && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Developer Details
                  </summary>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}