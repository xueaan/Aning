import React from 'react';
import { Search, X } from 'lucide-react';

interface PasswordSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const PasswordSearchInput: React.FC<PasswordSearchInputProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索条目..."
        className="pl-6 pr-8 py-1 w-32 rounded-md text-xs focus: outline-none focus:ring-1 focus:theme-ring-accent transition-all duration-200 theme-text-primary placeholder:theme-text-tertiary focus:w-40 bg-white/10 dark:bg-gray-900/20 backdrop-filter backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/30 hover:bg-white/15 dark:hover:bg-gray-900/30 focus:bg-white/20 , dark:focus:bg-gray-900/40 shadow-lg shadow-black/5,dark:shadow-black/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary hover:theme-text-primary p-0.5 rounded-sm, hover:theme-bg-secondary/50 transition-colors"
          title="清空搜索"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

