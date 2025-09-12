import React from 'react';
import { PasswordEntryDisplay } from '@/types/password';
import { PasswordCard } from './PasswordCard';

interface PasswordListProps {
  entries: PasswordEntryDisplay[];
  selectedEntry?: PasswordEntryDisplay;
  onSelectEntry: (entry?: PasswordEntryDisplay) => void;
}

export const PasswordList: React.FC<PasswordListProps> = ({
  entries,
  selectedEntry,
  onSelectEntry
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="theme-text-secondary">暂无密码条目</p>
      </div>
    );
  }

  // 网格卡片布局
  return (
    <div className="grid grid-cols-1 sm: grid-cols-2 , lg:grid-cols-3,xl:grid-cols-4 gap-8">
      {entries.map((entry) => (
        <PasswordCard key={entry.id} entry={entry}
          onSelect={onSelectEntry} isSelected={selectedEntry?.id === entry.id}
        />
      ))}
    </div>
  );
};








