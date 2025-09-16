import React from 'react';
import { DateCellProps } from './types';

export const DateCell: React.FC<DateCellProps> = ({
  date,
  isSelected,
  isToday,
  isCurrentMonth,
  isDisabled,
  onClick,
}) => {
  const getCellClassName = () => {
    let baseClass =
      'w-5 h-5 flex items-center justify-center text-xs rounded transition-all duration-200 cursor-pointer font-medium';

    if (isDisabled) {
      return baseClass + ' theme-text-disabled cursor-not-allowed opacity-50';
    }

    if (isSelected) {
      return baseClass + ' theme-bg-accent theme-text-on-accent shadow-sm';
    }

    if (isToday) {
      return baseClass + ' theme-text-accent border border-current bg-white/5';
    }

    if (isCurrentMonth) {
      return baseClass + ' theme-text-primary hover:bg-white/10, hover:shadow-sm';
    }

    return baseClass + ' theme-text-tertiary hover:theme-text-secondary, hover:bg-white/5';
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={getCellClassName()}
      title={date.dateString}
    >
      {date.day}
    </button>
  );
};
