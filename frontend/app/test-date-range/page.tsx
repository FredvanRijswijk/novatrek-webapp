"use client"

import { useState } from "react"
import { Calendar, DateRange } from "@/components/ui/calendar-range"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function TestDateRangePage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 12),
    to: new Date(2025, 6, 15),
  })

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Date Range Calendar Test</h1>
      
      <div className="max-w-2xl space-y-8">
        {/* Inline Calendar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Inline Calendar (Two Months)</h2>
          <div className="border rounded-lg p-4">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              className="rounded-lg border shadow-sm"
            />
          </div>
          {dateRange?.from && (
            <p className="text-sm text-muted-foreground">
              Selected: {dateRange.from && format(dateRange.from, 'LLL dd, y')}
              {dateRange.to && ` - ${format(dateRange.to, 'LLL dd, y')}`}
            </p>
          )}
        </div>

        {/* Popover Calendar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Popover Calendar</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick your travel dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from || new Date()}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => 
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Current Selection Info */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h3 className="font-medium">Current Selection:</h3>
          <pre className="text-sm">
            {JSON.stringify(dateRange, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}