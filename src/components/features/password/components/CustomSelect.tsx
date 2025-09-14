import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomSelectProps {
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  error?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  icon,
  value,
  onChange,
  placeholder,
  options,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted z-10">
          {icon}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full text-left flex items-center justify-between px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary feather-glass-deco',
          icon && 'pl-10',
          error ? 'border border-red-400/40' : 'border border-white/20'
        )}
      >
        <div className={cn(
          'flex items-center gap-2',
          selectedOption ? 'theme-text-primary' : 'theme-text-tertiary'
        )}>
          {selectedOption?.icon && React.isValidElement(selectedOption.icon) ? selectedOption.icon : null}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={16} className={cn(
          'transform transition-transform text-text-muted',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 theme-bg-secondary backdrop-blur-md border theme-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:theme-bg-tertiary transition-colors flex items-center gap-2 theme-text-primary"
            >
              {option.icon && React.isValidElement(option.icon) ? option.icon : null}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};