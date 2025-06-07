'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface PerformanceMetrics {
  renderTime: number
  firestoreQueries: number
  slowQueries: string[]
  memoryUsage: number
  fps: number
}

export function PerformanceMonitor({ show = false }: { show?: boolean }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    firestoreQueries: 0,
    slowQueries: [],
    memoryUsage: 0,
    fps: 60
  })

  useEffect(() => {
    if (!show) return

    let frameCount = 0
    let lastTime = performance.now()

    // Monitor FPS
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setMetrics(m => ({ ...m, fps: frameCount }))
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    const rafId = requestAnimationFrame(measureFPS)

    // Monitor memory (if available)
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
        setMetrics(m => ({ ...m, memoryUsage: usedMB }))
      }
    }, 1000)

    // Intercept Firestore operations
    let queryCount = 0
    const slowQueries: string[] = []
    
    // Override console.log to catch Firestore timing
    const originalLog = console.log
    console.log = (...args) => {
      const message = args.join(' ')
      if (message.includes('Firestore')) {
        queryCount++
        setMetrics(m => ({ ...m, firestoreQueries: queryCount }))
        
        // Check for slow queries (you'd need to implement timing)
        if (message.includes('slow')) {
          slowQueries.push(message)
          setMetrics(m => ({ ...m, slowQueries }))
        }
      }
      originalLog(...args)
    }

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(memoryInterval)
      console.log = originalLog
    }
  }, [show])

  if (!show) return null

  const fpsColor = metrics.fps > 50 ? 'text-green-500' : 
                   metrics.fps > 30 ? 'text-yellow-500' : 'text-red-500'

  return (
    <Card className="fixed bottom-4 right-4 p-4 z-50 bg-background/95 backdrop-blur w-64">
      <h3 className="font-semibold mb-2">Performance Monitor</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={fpsColor}>{metrics.fps}</span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span>{metrics.memoryUsage} MB</span>
        </div>
        <div className="flex justify-between">
          <span>Firestore Queries:</span>
          <span>{metrics.firestoreQueries}</span>
        </div>
        {metrics.slowQueries.length > 0 && (
          <div className="mt-2 text-xs text-red-500">
            <div>Slow Queries:</div>
            {metrics.slowQueries.map((q, i) => (
              <div key={i} className="truncate">{q}</div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// Hook to measure component render time
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (duration > 50) {
        console.warn(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms`)
      }
    }
  })
}

// HOC to profile any component
export function withPerformanceTracking<T extends {}>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function TrackedComponent(props: T) {
    useRenderTime(componentName)
    return <Component {...props} />
  }
}