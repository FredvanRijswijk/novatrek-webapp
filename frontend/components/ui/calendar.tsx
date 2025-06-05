'use client'

import * as React from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface CalendarProps {
  mode?: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  className?: string
}

function Calendar({
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Get the first day of the week for the month
  const firstDayOfWeek = days[0].getDay()

  return (
    <div className={cn('p-3', className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-muted-foreground text-center text-sm font-normal"
            >
              {day}
            </div>
          ))}
          
          {/* Empty cells for alignment */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}
          
          {days.map((day) => {
            const isSelected = selected && isSameDay(day, selected)
            const isDisabled = disabled?.(day)
            const isTodayDate = isToday(day)

            return (
              <Button
                key={day.toISOString()}
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                onClick={() => !isDisabled && onSelect?.(day)}
                disabled={isDisabled}
                className={cn(
                  'h-9 w-9 p-0 font-normal',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  isTodayDate && !isSelected && 'bg-accent text-accent-foreground',
                  isDisabled && 'text-muted-foreground opacity-50 cursor-not-allowed'
                )}
              >
                {format(day, 'd')}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }