'use client';

import * as React from 'react';
import { DayPicker, UI, DayFlag, SelectionState, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        [UI.Months]: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        [UI.Month]: 'space-y-4',
        [UI.MonthCaption]: 'flex justify-center pt-1 relative items-center',
        [UI.CaptionLabel]: 'text-sm font-medium',
        [UI.Nav]: 'space-x-1 flex items-center',
        [UI.PreviousMonthButton]: cn(
          'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        ),
        [UI.NextMonthButton]: cn(
          'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        ),
        [UI.MonthGrid]: 'w-full border-collapse space-y-1',
        [UI.Weekdays]: 'flex',
        [UI.Weekday]: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        [UI.Week]: 'flex w-full mt-2',
        [UI.Day]: cn(
          'h-9 w-9 text-center text-sm p-0 relative font-normal',
          'inline-flex items-center justify-center rounded-md text-sm transition-colors',
          'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          '[&[aria-selected]]:bg-accent [&[aria-selected]]:text-accent-foreground'
        ),
        [UI.DayButton]: 'h-9 w-9 p-0 font-normal',
        [`${SelectionState.range_end}`]: 'rounded-r-md',
        [`${DayFlag.outside}`]: 'text-muted-foreground opacity-50',
        [`${DayFlag.disabled}`]: 'text-muted-foreground opacity-50',
        [`${DayFlag.hidden}`]: 'invisible',
        ...classNames
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
