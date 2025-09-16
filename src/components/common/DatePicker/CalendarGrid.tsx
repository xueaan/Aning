import React from 'react';
import { CalendarGridProps } from './types';
import { DateCell } from './DateCell';
import { generateCalendarDays, getWeekDays, isDateDisabled } from './utils';

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}) => {
  const weekDays = getWeekDays();
  const calendarDays = generateCalendarDays(currentDate);

  return (
    <div className="px-2 pb-2">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs theme-text-secondary py-1 font-medium">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day) => (
          <DateCell
            key={day.key}
            date={day}
            isSelected={day.dateString === selectedDate}
            isToday={day.isToday}
            isCurrentMonth={day.isCurrentMonth}
            isDisabled={isDateDisabled(day.date, minDate, maxDate)}
            onClick={() =>
              !isDateDisabled(day.date, minDate, maxDate) && onDateSelect(day.dateString)
            }
          />
        ))}
      </div>
    </div>
  );
};
