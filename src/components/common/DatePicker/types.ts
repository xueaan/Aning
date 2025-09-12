export interface DatePickerProps {
  value?: string;                    // 当前选中日期 (YYYY-MM-DD)
  onChange?: (date: string) => void; // 日期选择回调
  onClose?: () => void;              // 关闭回调
  placeholder?: string;              // 占位文本
  className?: string;                // 额外样式类
  showShortcuts?: boolean;           // 是否显示快捷按钮
  shortcuts?: ShortcutOption[];      // 自定义快捷选项
  minDate?: string;                  // 最小可选日期
  maxDate?: string;                  // 最大可选日期
  disabled?: boolean;                // 是否禁用
  size?: 'sm' | 'md' | 'lg';        // 尺寸规格
}

export interface ShortcutOption {
  label: string;
  value: string | (() => string);
  icon?: React.ReactNode;
}

export interface CalendarDay {
  date: Date;
  day: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  key: string;
}

export interface CalendarProps {
  currentDate: Date;
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export interface CalendarDayProps {
  date: CalendarDay;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  onMonthChange: (delta: number) => void;
  onYearChange: (year: number) => void;
}

export interface ShortcutsProps {
  shortcuts?: ShortcutOption[];
  onSelect: (date: string) => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export interface DateCellProps {
  date: CalendarDay;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export interface DateNavigationProps {
  currentDate: Date;
  onMonthChange: (delta: number) => void;
  onYearChange: (year: number) => void;
}

export interface DateShortcutsProps {
  shortcuts?: ShortcutOption[];
  onSelect: (date: string) => void;
}