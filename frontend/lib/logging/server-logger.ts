import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

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
  endpoint?: string
  method?: string
  statusCode?: number
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4
}

class ServerLogger {
  private sessionId: string
  private minLevel: LogLevel

  constructor() {
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.minLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private async logToFirestore(entry: LogEntry) {
    try {
      // Try to get Admin DB, but don't throw if it fails
      let adminDb;
      try {
        adminDb = getAdminDb()
      } catch (e) {
        // Admin SDK not initialized, skip Firestore logging
        console.warn('Firebase Admin SDK not initialized, skipping Firestore logging')
        return
      }
      
      if (!adminDb) {
        console.error('Failed to get admin database for logging')
        return
      }

      // Clean the entry to remove undefined values
      const cleanEntry = this.cleanForFirestore(entry)
      
      // Store in logs collection with server timestamp
      await adminDb.collection('logs').add({
        ...cleanEntry,
        sessionId: this.sessionId,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(), // Backup timestamp
        source: 'server' // Indicate this is from server-side
      })
    } catch (error) {
      // If Firestore logging fails, at least log to console
      console.error('Failed to log to Firestore:', error)
    }
  }

  private cleanForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null
    }
    
    if (obj instanceof Date) {
      return obj.toISOString()
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanForFirestore(item))
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanForFirestore(value)
        }
      }
      return cleaned
    }
    
    return obj
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
      userId: metadata?.userId,
      metadata,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      endpoint: metadata?.endpoint,
      method: metadata?.method,
      statusCode: metadata?.statusCode
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

    // Firestore logging (async, don't await to avoid blocking)
    this.logToFirestore(entry).catch(err => {
      console.error('Background logging error:', err)
    })
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

  // API route logging utilities
  async logApiRequest(
    endpoint: string,
    method: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    await this.info('api', `${method} ${endpoint}`, {
      ...metadata,
      endpoint,
      method,
      userId
    })
  }

  async logApiResponse(
    endpoint: string,
    method: string,
    statusCode: number,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const level = statusCode >= 400 ? 'error' : 'info'
    await this.log(level as LogLevel, 'api', `${method} ${endpoint} - ${statusCode}`, {
      ...metadata,
      endpoint,
      method,
      statusCode,
      userId
    })
  }

  async logApiError(
    endpoint: string,
    method: string,
    error: Error,
    userId?: string,
    requestData?: any,
    responseData?: any
  ) {
    await this.error('api', `API Error: ${endpoint}`, error, {
      endpoint,
      method,
      userId,
      requestData,
      responseData,
      statusCode: (error as any).statusCode || (error as any).status || 500
    })
  }

  // Stripe operation logging
  async logStripeOperation(
    operation: string,
    success: boolean,
    metadata?: Record<string, any>,
    error?: Error
  ) {
    if (success) {
      await this.info('stripe', `Stripe operation: ${operation}`, metadata)
    } else {
      await this.error('stripe', `Stripe operation failed: ${operation}`, error, metadata)
    }
  }

  // Subscription logging
  async logSubscriptionEvent(
    event: string,
    userId: string,
    metadata?: Record<string, any>,
    error?: Error
  ) {
    if (error) {
      await this.error('subscription', `Subscription event failed: ${event}`, error, {
        ...metadata,
        userId,
        event
      })
    } else {
      await this.info('subscription', `Subscription event: ${event}`, {
        ...metadata,
        userId,
        event
      })
    }
  }
}

// Create singleton instance for server-side use
const serverLogger = new ServerLogger()

export default serverLogger