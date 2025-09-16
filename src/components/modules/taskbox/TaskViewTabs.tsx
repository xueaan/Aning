import React from 'react';
import { Inbox, Calendar, Clock, AlertTriangle, Check } from 'lucide-react';

type TaskView = 'inbox' | 'today' | 'upcoming' | 'overdue' | 'completed';

interface TaskViewTabsProps {
  current: string;
  onChange: (view: TaskView) => void;
  counts: {
    inbox: number;
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

export const TaskViewTabs: React.FC<TaskViewTabsProps> = React.memo(({ current, onChange, counts }) => {
  return (
    <div className="flex items-center gap-1 ml-2">
      <button
        onClick={() => onChange('inbox')}
        className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all theme-border ${
          current === 'inbox'
            ? 'theme-bg-accent theme-text-smart-contrast shadow-md'
            : 'theme-text-primary hover:theme-bg-secondary/50, hover:theme-text-primary backdrop-blur-sm'
        }`}
        title="收集箱"
      >
        <Inbox size={16} />
        {counts.inbox > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${
              current === 'inbox'
                ? 'theme-bg-accent-contrast/30 theme-text-smart-contrast'
                : 'status-info/20 theme-text-info'
            }`}
          >
            {counts.inbox > 99 ? '99' : counts.inbox}
          </span>
        )}
      </button>

      <button
        onClick={() => onChange('today')}
        className={`relative px-1.5 py-1.5 rounded-md text-xs font-medium transition-all theme-border ${
          current === 'today'
            ? 'status-success theme-text-smart-contrast shadow-md'
            : 'theme-text-primary hover:theme-bg-secondary/50, hover:theme-text-primary backdrop-blur-sm'
        }`}
        title="今天"
      >
        <Calendar size={16} />
        {counts.today > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${
              current === 'today'
                ? 'theme-bg-accent-contrast/30 theme-text-smart-contrast'
                : 'status-success/20 theme-text-success'
            }`}
          >
            {counts.today > 99 ? '99' : counts.today}
          </span>
        )}
      </button>

      <button
        onClick={() => onChange('upcoming')}
        className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all theme-border ${
          current === 'upcoming'
            ? 'status-warning theme-text-smart-contrast shadow-md'
            : 'theme-text-primary hover:theme-bg-secondary/50, hover:theme-text-primary backdrop-blur-sm'
        }`}
        title="即将到来"
      >
        <Clock size={16} />
        {counts.upcoming > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${
              current === 'upcoming'
                ? 'theme-bg-accent-contrast/30 theme-text-smart-contrast'
                : 'status-warning/20 theme-text-warning'
            }`}
          >
            {counts.upcoming > 99 ? '99' : counts.upcoming}
          </span>
        )}
      </button>

      <button
        onClick={() => onChange('overdue')}
        className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all theme-border ${
          current === 'overdue'
            ? 'status-error theme-text-smart-contrast shadow-md'
            : 'theme-text-primary hover:theme-bg-secondary/50, hover:theme-text-primary backdrop-blur-sm'
        }`}
        title="逾期"
      >
        <AlertTriangle size={16} />
        {counts.overdue > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${
              current === 'overdue'
                ? 'theme-bg-accent-contrast/30 theme-text-smart-contrast'
                : 'status-error/20 theme-text-error'
            }`}
          >
            {counts.overdue > 99 ? '99' : counts.overdue}
          </span>
        )}
      </button>

      <button
        onClick={() => onChange('completed')}
        className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all theme-border ${
          current === 'completed'
            ? 'status-info theme-text-smart-contrast shadow-md'
            : 'theme-text-primary hover:theme-bg-secondary/50, hover:theme-text-primary backdrop-blur-sm'
        }`}
        title="已完成"
      >
        <Check size={16} />
        {counts.completed > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${
              current === 'completed'
                ? 'theme-bg-accent-contrast/30 theme-text-smart-contrast'
                : 'status-info/20 theme-text-info'
            }`}
          >
            {counts.completed > 99 ? '99' : counts.completed}
          </span>
        )}
      </button>
    </div>
  );
});

TaskViewTabs.displayName = 'TaskViewTabs';
