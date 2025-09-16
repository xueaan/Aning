import { CalendarDay } from './types';
import { formatDate } from '@/utils/timeUtils';

// 生成日历网格数据
export const generateCalendarDays = (date: Date): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 获取上个月的最后几天（填充当月第一周）
  const firstWeekday = firstDay.getDay();
  const prevMonthLastDate = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  // 添加上个月的天数
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const dayNumber = prevMonthLastDate - i;
    const dayDate = new Date(year, month - 1, dayNumber);
    days.push({
      day: dayNumber,
      date: dayDate,
      dateString: formatDate(dayDate),
      isCurrentMonth: false,
      isToday: false,
      key: `prev-${dayNumber}`,
    });
  }

  // 添加当月的天数
  const lastDate = lastDay.getDate();
  const today = new Date();
  const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;

  for (let dayNumber = 1; dayNumber <= lastDate; dayNumber++) {
    const currentDate = new Date(year, month, dayNumber);
    const isToday = isCurrentYearMonth && today.getDate() === dayNumber;

    days.push({
      day: dayNumber,
      date: currentDate,
      dateString: formatDate(currentDate),
      isCurrentMonth: true,
      isToday,
      key: `current-${dayNumber}`,
    });
  }

  // 添加下个月的天数（填充最后一周）
  const remainingCells = 42 - days.length; // 6周 * 7天 = 42
  for (let dayNumber = 1; dayNumber <= remainingCells; dayNumber++) {
    const dayDate = new Date(year, month + 1, dayNumber);
    days.push({
      day: dayNumber,
      date: dayDate,
      dateString: formatDate(dayDate),
      isCurrentMonth: false,
      isToday: false,
      key: `next-${dayNumber}`,
    });
  }

  return days;
};

// 格式化月份年份显示
export const formatMonthYear = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}年${month}月`;
};

// 格式化日期显示
export const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) {
    return '今天';
  } else if (isSameDay(date, yesterday)) {
    return '昨天';
  } else if (isSameDay(date, tomorrow)) {
    return '明天';
  }

  return formatDate(date);
};

// 获取星期标题
export const getWeekdayLabels = (): string[] => {
  return ['日', '一', '二', '三', '四', '五', '六'];
};

// 检查日期是否为今天
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

// 检查两个日期是否相等
export const isSameDay = (date1: Date, date2: Date | null): boolean => {
  if (!date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// 获取相对时间文本
export const getRelativeText = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) {
    return '今天';
  } else if (isSameDay(date, yesterday)) {
    return '昨天';
  } else if (isSameDay(date, tomorrow)) {
    return '明天';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

// 检查日期是否在范围内
export const isDateInRange = (date: Date, minDate?: string, maxDate?: string): boolean => {
  if (minDate) {
    const min = new Date(minDate);
    if (date < min) return false;
  }

  if (maxDate) {
    const max = new Date(maxDate);
    if (date > max) return false;
  }

  return true;
};

// 获取星期几的数组
export const getWeekDays = (): string[] => {
  return ['日', '一', '二', '三', '四', '五', '六'];
};

// 检查日期是否被禁用
export const isDateDisabled = (date: Date, minDate?: string, maxDate?: string): boolean => {
  return !isDateInRange(date, minDate, maxDate);
};

// 获取月份名称
export const getMonthName = (date: Date): string => {
  const months = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  return months[date.getMonth()];
};

// 添加天数
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// 获取下个周一
export const getNextMonday = (): Date => {
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = (1 - day + 7) % 7 || 7; // 如果今天是周一，返回下周一
  return addDays(today, daysUntilMonday);
};
