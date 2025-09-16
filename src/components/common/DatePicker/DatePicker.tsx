import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePickerProps } from './types';
import { CalendarGrid } from './CalendarGrid';
import { DateNavigation } from './DateNavigation';
import { DateShortcuts } from './DateShortcuts';
import { formatDateDisplay } from './utils';
import { Calendar, ChevronDown } from 'lucide-react';

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onClose,
  placeholder = '选择日期',
  className = '',
  showShortcuts = true,
  shortcuts,
  minDate,
  maxDate,
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  });
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 检查点击是否在触发按钮上
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }

      // 检查点击是否在弹窗内
      const datePickerPopup = document.querySelector('[data-datepicker-popup="true"]');
      if (datePickerPopup && datePickerPopup.contains(target)) {
        return;
      }

      handleClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 窗口大小变化时重新计算位置
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    if (isOpen) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen]);

  // 计算弹窗位置
  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const viewportHeight = window.innerHeight;

    // 垂直位置：优先下方
    let top = triggerRect.bottom + 8;

    // 如果下方空间不足，显示在上方
    if (top + dropdownHeight > viewportHeight && triggerRect.top > dropdownHeight) {
      top = triggerRect.top - dropdownHeight - 8;
    }

    // 水平位置：默认左对齐，如果空间不足则右对齐
    let left = triggerRect.left;
    const dropdownWidth = 220;

    if (left + dropdownWidth > window.innerWidth) {
      left = triggerRect.right - dropdownWidth;
    }

    // 确保不超出左边界
    left = Math.max(8, left);

    setPosition({ top, left });
  };

  const handleOpen = () => {
    if (disabled) return;
    calculatePosition();
    setIsOpen(true);
    // 如果有选中值，显示对应月份
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleDateSelect = (dateString: string) => {
    onChange?.(dateString);
    handleClose();
  };

  const handleMonthChange = (delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const handleYearChange = (year: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
  };

  const handleShortcutSelect = (dateString: string) => {
    onChange?.(dateString);
    handleClose();
  };

  // 获取触发按钮样式
  const getTriggerClassName = () => {
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    let baseClass = `flex items-center gap-2 rounded-lg transition-all duration-200 theme-text-primary min-w-32 ${sizeClasses[size]}`;

    if (disabled) {
      baseClass += ' opacity-50 cursor-not-allowed';
    } else {
      baseClass += ' hover:shadow-sm cursor-pointer';
    }

    return baseClass;
  };

  // 显示文本
  const displayText = value ? formatDateDisplay(value) : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 触发按钮 */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={getTriggerClassName()}
      >
        <Calendar
          size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12}
          className="theme-text-secondary"
        />
        <span className={value ? 'theme-text-primary' : 'theme-text-tertiary'}>{displayText}</span>
        <ChevronDown
          size={size === 'sm' ? 10 : 12}
          className={`theme-text-secondary ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-[99999] rounded-lg shadow-2xl backdrop-blur-sm border border-white/10 overflow-hidden w-56"
                data-datepicker-popup="true"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                }}
              >
                {/* 导航头部 */}
                <DateNavigation
                  currentDate={currentDate}
                  onMonthChange={handleMonthChange}
                  onYearChange={handleYearChange}
                />

                {/* 日历网格 */}
                <CalendarGrid
                  currentDate={currentDate}
                  selectedDate={value}
                  onDateSelect={handleDateSelect}
                  minDate={minDate}
                  maxDate={maxDate}
                />

                {/* 快捷按钮 */}
                {showShortcuts && (
                  <DateShortcuts shortcuts={shortcuts} onSelect={handleShortcutSelect} />
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
