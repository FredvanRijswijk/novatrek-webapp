'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import logger from './logger'

interface LoggerContextValue {
  logger: typeof logger
}

const LoggerContext = createContext<LoggerContextValue | null>(null)

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useFirebase()

  useEffect(() => {
    // Set user ID in logger when user changes
    logger.setUserId(user?.uid)
  }, [user])

  return (
    <LoggerContext.Provider value={{ logger }}>
      {children}
    </LoggerContext.Provider>
  )
}

export function useLogger() {
  const context = useContext(LoggerContext)
  if (!context) {
    // Return logger directly if not in provider
    return logger
  }
  return context.logger
}