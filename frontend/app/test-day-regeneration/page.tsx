"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DateRange } from "@/components/ui/calendar-range"
import { format } from "date-fns"
import { DayModelV2 } from "@/lib/models/v2/day-model-v2"
import { CalendarIcon, AlertCircle, CheckCircle, Info } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function TestDayRegenerationPage() {
  const [originalRange] = useState<DateRange>({
    from: new Date(2025, 0, 1), // Jan 1, 2025
    to: new Date(2025, 0, 10),  // Jan 10, 2025
  })
  
  const [newRange, setNewRange] = useState<DateRange>({
    from: new Date(2025, 0, 5),  // Jan 5, 2025
    to: new Date(2025, 0, 15),  // Jan 15, 2025
  })
  
  const [result, setResult] = useState<any>(null)

  // Generate list of days for visualization
  const generateDaysList = (range: DateRange) => {
    if (!range.from || !range.to) return []
    const days = []
    const current = new Date(range.from)
    while (current <= range.to) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const originalDays = generateDaysList(originalRange)
  const newDays = generateDaysList(newRange)

  // Simulate what would happen
  const simulateUpdate = () => {
    if (!newRange.from || !newRange.to) return

    const created = []
    const deleted = []
    const preserved = []

    // Check each original day
    originalDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const inNewRange = day >= newRange.from! && day <= newRange.to!
      
      if (inNewRange) {
        preserved.push(dayStr)
      } else {
        deleted.push(dayStr)
      }
    })

    // Check for new days
    newDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const wasInOriginal = originalDays.some(
        oDay => format(oDay, 'yyyy-MM-dd') === dayStr
      )
      
      if (!wasInOriginal) {
        created.push(dayStr)
      }
    })

    setResult({
      created: created.length,
      deleted: deleted.length,
      preserved: preserved.length,
      createdDays: created,
      deletedDays: deleted,
      preservedDays: preserved,
    })
  }

  useEffect(() => {
    simulateUpdate()
  }, [newRange])

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Day Regeneration Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Range */}
        <Card>
          <CardHeader>
            <CardTitle>Original Trip Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                {format(originalRange.from!, 'MMM d')} - {format(originalRange.to!, 'MMM d, yyyy')}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Days in trip:</h4>
                <div className="grid grid-cols-5 gap-2">
                  {originalDays.map((day, i) => (
                    <div
                      key={i}
                      className="text-center p-2 border rounded text-sm"
                    >
                      <div className="font-medium">Day {i + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Range */}
        <Card>
          <CardHeader>
            <CardTitle>New Trip Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Calendar
                mode="range"
                defaultMonth={newRange.from}
                selected={newRange}
                onSelect={setNewRange}
                numberOfMonths={1}
                className="rounded-lg border"
              />
              
              {newRange.from && newRange.to && (
                <div className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5" />
                  {format(newRange.from, 'MMM d')} - {format(newRange.to, 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What Will Happen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Created</AlertTitle>
                  <AlertDescription>
                    {result.created} new days will be added
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Preserved</AlertTitle>
                  <AlertDescription>
                    {result.preserved} days will be kept
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle>Deleted</AlertTitle>
                  <AlertDescription>
                    {result.deleted} days will be removed
                  </AlertDescription>
                </Alert>
              </div>

              {/* Visual representation */}
              <div className="space-y-4">
                <h4 className="font-medium">Day-by-Day Changes:</h4>
                <div className="grid grid-cols-6 gap-2">
                  {newDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd')
                    const isNew = result.createdDays.includes(dayStr)
                    const isPreserved = result.preservedDays.includes(dayStr)
                    
                    return (
                      <div
                        key={i}
                        className={`text-center p-3 border rounded-lg text-sm ${
                          isNew 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700'
                        }`}
                      >
                        <div className="font-medium">Day {i + 1}</div>
                        <div className="text-xs opacity-80">
                          {format(day, 'MMM d')}
                        </div>
                        <div className="text-xs mt-1">
                          {isNew ? '✨ New' : '✓ Kept'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {result.deleted > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-orange-600">Days to be removed:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {result.deletedDays.map((dayStr: string) => (
                        <div
                          key={dayStr}
                          className="px-3 py-1 bg-orange-50 border border-orange-500 text-orange-700 rounded text-sm"
                        >
                          {format(new Date(dayStr), 'MMM d')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>• Days within both date ranges are preserved with all their activities</li>
                    <li>• New days are created for dates only in the new range</li>
                    <li>• Days outside the new range are removed (if they have no activities)</li>
                    <li>• Days with activities outside the range are flagged for manual review</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}