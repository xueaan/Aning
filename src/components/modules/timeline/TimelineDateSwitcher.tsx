import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DatePicker } from '@/components/common/DatePicker';

interface TimelineDateSwitcherProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onChange: (date: Date) => void;
}

export const TimelineDateSwitcher: React.FC<TimelineDateSwitcherProps> = ({
  currentDate,
  onPrev,
  onNext,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onPrev} className="titlebar-nav-button" title="前一天">
        <ChevronLeft size={16} />
      </button>
      <DatePicker
        value={currentDate.toISOString().split('T')[0]}
        onChange={(dateString: string) => onChange(new Date(dateString))}
      />
      <button onClick={onNext} className="titlebar-nav-button" title="后一天">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

