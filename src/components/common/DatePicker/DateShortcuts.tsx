import React from 'react';
import { DateShortcutsProps } from './types';
import { addDays, getNextMonday } from './utils';
import { formatDate } from '@/utils/timeUtils';
import { Calendar, Clock, X } from 'lucide-react';

export const DateShortcuts: React.FC<DateShortcutsProps> = ({
  shortcuts,
  onSelect
}) => {
  const defaultShortcuts = [
    { 
      label: '今天', 
      value: () => formatDate(new Date()),
      icon: <Calendar size={12} />
    }, 
    { 
      label: '明天', 
      value: () => formatDate(addDays(new Date(), 1)),
      icon: <Clock size={12} />
    },
    { 
      label: '下周', 
      value: () => formatDate(addDays(new Date(), 7))
    },
    { 
      label: '下周一', 
      value: () => formatDate(getNextMonday())
    },
    { 
      label: '清除', 
      value: '',
      icon: <X size={12} />
    }
  ];

  const finalShortcuts = shortcuts || defaultShortcuts;

  const handleShortcutClick = (shortcut: typeof finalShortcuts[0]) => {
    const value = typeof shortcut.value === 'function' ? shortcut.value() : shortcut.value;
    onSelect(value);
  };

  return (
    <div className="p-1.5 border-t border-white/10 bg-white/5">
      <div className="flex flex-wrap gap-1">
        {finalShortcuts.map((shortcut, index) => (
          <button key={index} onClick={() => handleShortcutClick(shortcut)}
            
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full bg-white/10 hover: bg-white/20 theme-text-secondary , hover:theme-text-primary transition-all duration-200 font-medium shadow-sm,hover:shadow-md"
          >
            {shortcut.icon && (
              <span className="opacity-70">
                {shortcut.icon}
              </span>
            )}
            {shortcut.label}
          </button>
        ))}
      </div>
    </div>
  );
};









