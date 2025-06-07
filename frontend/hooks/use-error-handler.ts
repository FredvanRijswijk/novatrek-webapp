import { useCallback } from 'react'
import { useLogger } from '@/lib/logging/LoggerProvider'
import { toast } from 'sonner'
import type { LogCategory } from '@/lib/logging/logger'

interface ErrorHandlerOptions {
  showToast?: boolean
  toastMessage?: string
  category?: LogCategory
  fallbackAction?: () => void
}

export function useErrorHandler() {
  const logger = useLogger()

  const handleError = useCallback(
    async (
      error: Error | unknown,
      context: string,
      options: ErrorHandlerOptions = {}
    ) => {
      const {
        showToast = true,
        toastMessage = 'Something went wrong. Please try again.',
        category = 'general',
        fallbackAction
      } = options

      // Log the error
      const errorObj = error instanceof Error ? error : new Error(String(error))
      await logger.error(category, `Error in ${context}`, errorObj, {
        context,
        timestamp: new Date().toISOString()
      })

      // Show toast if requested
      if (showToast) {
        toast.error(toastMessage)
      }

      // Execute fallback action if provided
      if (fallbackAction) {
        fallbackAction()
      }

      // Re-throw if in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error in ${context}:`, error)
      }
    },
    [logger]
  )

  const logAction = useCallback(
    async (action: string, category: LogCategory = 'general', metadata?: Record<string, any>) => {
      await logger.logUserAction(action, category, metadata)
    },
    [logger]
  )

  const logPerformance = useCallback(
    async (operation: string, duration: number, category: LogCategory = 'general') => {
      await logger.logPerformance(category, operation, duration)
    },
    [logger]
  )

  return {
    handleError,
    logAction,
    logPerformance,
    logger
  }
}