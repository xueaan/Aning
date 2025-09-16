import React, { useState } from 'react';
import { DateNavigationProps } from './types';
import { getMonthName } from './utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onMonthChange,
  onYearChange,
}) => {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: getMonthName(new Date(currentYear, i, 1)),
  }));

  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(currentYear, month, 1);
    onYearChange(newDate.getFullYear());
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    setShowYearPicker(false);
  };

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10">
      {/* 上一月按钮 */}
      <button
        onClick={() => onMonthChange(-1)}
        className="p-1 rounded hover:bg-white/10 theme-text-secondary, hover:theme-text-primary transition-all duration-200"
        title="上一月"
      >
        <ChevronLeft size={16} />
      </button>
      {/* 月份年份显示 */}
      <div className="flex items-center gap-1 relative">
        <button
          onClick={() => setShowYearPicker(!showYearPicker)}
          className="px-1.5 py-0.5 rounded hover:bg-white/10 theme-text-primary font-medium transition-all duration-200 text-xs"
        >
          {currentYear}年
        </button>
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="px-1.5 py-0.5 rounded hover:bg-white/10 theme-text-primary font-medium transition-all duration-200 text-xs"
        >
          {getMonthName(currentDate)}
        </button>
        {/* 月份选择器弹窗 */}
        {showMonthPicker && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 z-50 p-2">
            <div className="grid grid-cols-3 gap-1 w-48">
              {months.map((month) => (
                <button
                  key={month.value}
                  onClick={() => handleMonthSelect(month.value)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    month.value === currentMonth
                      ? 'theme-bg-accent theme-text-on-accent shadow-sm'
                      : 'theme-text-primary hover:bg-white/10'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 年份选择器弹窗 */}
        {showYearPicker && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 z-50 p-2 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 w-32">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    year === currentYear
                      ? 'theme-bg-accent theme-text-on-accent shadow-sm'
                      : 'theme-text-primary hover:bg-white/10'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => onMonthChange(1)}
        className="p-1 rounded hover:bg-white/10 theme-text-secondary, hover:theme-text-primary transition-all duration-200"
        title="下一月"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
