import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '@/types';
import { Check, X } from 'lucide-react';

interface SimpleTaskQuickAddProps {
  onSubmit: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  defaultStatus?: TaskStatus;
  placeholder?: string;
  compact?: boolean;
}

export const SimpleTaskQuickAdd: React.FC<SimpleTaskQuickAddProps> = ({
  onSubmit,
  onCancel,
  defaultStatus = 'todo',
  placeholder = '添加任务...',
  compact = false
}) => {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: undefined,
      status: defaultStatus,
      priority: 'medium',
      due_date: undefined,
      completed_at: undefined,
      project_id: null,
      tags: []
    });

    setTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} 
            className="space-y-3">
      <input ref={inputRef} type="text"
        value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown} placeholder={placeholder}
        
            className={`
          w-full px-3 py-2 border border-border-secondary rounded-lg
          bg-bg-primary text-text-primary placeholder-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          ${compact ? 'text-sm' : ''}
        `}
        autoComplete="off"
      />
      
      <div className="flex items-center gap-2">
        <button type="submit"
          
            className="flex items-center gap-1 px-3 py-1.5 theme-bg-accent theme-text-on-accent rounded text-sm hover:theme-bg-accent-hover transition-colors"
        >
          <Check size={16} />
          添加
        </button>
        <button type="button"
          onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 theme-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded text-sm transition-colors"
        >
          <X size={16} />
          取消
        </button>
      </div>
    </form>
  );
};











