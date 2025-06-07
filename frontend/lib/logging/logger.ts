import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogCategory = 
  | 'auth' 
  | 'subscription' 
  | 'marketplace' 
  | 'payment' 
  | 'api' 
  | 'firebase' 
  | 'stripe'
  | 'ai'
  | 'email'
  | 'general'

interface LogEntry {
  level: LogLevel
  category: LogCategory
  message: string
  userId?: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  timestamp: Date
  environment: string
  userAgent?: string
  url?: string
}

interface LoggerConfig {
  enableConsole: boolean
  enableFirestore: boolean
  enableSentry: boolean // For future integration
  minLevel: LogLevel
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4
}

class Logger {
  private config: LoggerConfig
  private userId?: string
  private sessionId: string

  constructor() {
    this.config = {
      enableConsole: process.env.NODE_ENV === 'development',
      enableFirestore: true, // Always log to Firestore for now
      enableSentry: false,
      minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    }
    
    // Generate unique session ID
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string | undefined) {
    this.userId = userId
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  private async logToFirestore(entry: LogEntry) {
    if (!this.config.enableFirestore) return

    try {
      // Store in a logs collection with automatic timestamps
      await addDoc(collection(db, 'logs'), {
        ...entry,
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        createdAt: new Date() // Backup timestamp
      })
    } catch (error) {
      // If Firestore logging fails, at least log to console
      console.error('Failed to log to Firestore:', error)
    }
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    return `${prefix} ${entry.message}`
  }

  private async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      category,
      message,
      userId: this.userId,
      metadata,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    // Add error details if provided
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    }

    // Console logging
    if (this.config.enableConsole) {
      const consoleMessage = this.formatConsoleMessage(entry)
      const consoleData = { ...metadata }
      if (error) consoleData.error = error

      switch (level) {
        case 'debug':
          console.log(consoleMessage, consoleData)
          break
        case 'info':
          console.info(consoleMessage, consoleData)
          break
        case 'warn':
          console.warn(consoleMessage, consoleData)
          break
        case 'error':
        case 'critical':
          console.error(consoleMessage, consoleData)
          break
      }
    }

    // Firestore logging
    await this.logToFirestore(entry)

    // Future: Send to Sentry for error/critical levels
    if (this.config.enableSentry && (level === 'error' || level === 'critical')) {
      // TODO: Implement Sentry integration
    }
  }

  // Public logging methods
  debug(category: LogCategory, message: string, metadata?: Record<string, any>) {
    return this.log('debug', category, message, metadata)
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>) {
    return this.log('info', category, message, metadata)
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>) {
    return this.log('warn', category, message, metadata)
  }

  error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>) {
    return this.log('error', category, message, metadata, error)
  }

  critical(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>) {
    return this.log('critical', category, message, metadata, error)
  }

  // Utility method for API errors
  async logApiError(
    endpoint: string,
    error: Error,
    requestData?: any,
    responseData?: any
  ) {
    await this.error('api', `API Error: ${endpoint}`, error, {
      endpoint,
      requestData,
      responseData,
      statusCode: (error as any).statusCode || (error as any).status
    })
  }

  // Utility method for Stripe errors
  async logStripeError(
    operation: string,
    error: Error,
    stripeData?: any
  ) {
    await this.error('stripe', `Stripe Error: ${operation}`, error, {
      operation,
      stripeData,
      stripeCode: (error as any).code,
      stripeType: (error as any).type
    })
  }

  // Utility method for Firebase errors
  async logFirebaseError(
    operation: string,
    error: Error,
    collection?: string,
    documentId?: string
  ) {
    await this.error('firebase', `Firebase Error: ${operation}`, error, {
      operation,
      collection,
      documentId,
      firebaseCode: (error as any).code
    })
  }

  // Performance logging
  async logPerformance(
    category: LogCategory,
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    const level: LogLevel = duration > 3000 ? 'warn' : 'info'
    await this.log(level, category, `Performance: ${operation} took ${duration}ms`, {
      ...metadata,
      duration,
      operation
    })
  }

  // User action logging
  async logUserAction(
    action: string,
    category: LogCategory,
    metadata?: Record<string, any>
  ) {
    await this.info(category, `User Action: ${action}`, {
      ...metadata,
      action,
      timestamp: new Date().toISOString()
    })
  }
}

// Create singleton instance
const logger = new Logger()

// Export for use throughout the app
export default logger

// React hook for setting user context
export function useLogger(userId?: string) {
  if (userId) {
    logger.setUserId(userId)
  }
  return logger
}