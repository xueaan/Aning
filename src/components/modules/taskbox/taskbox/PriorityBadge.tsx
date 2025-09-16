import React from 'react';
import { TaskPriority } from '@/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showText = false,
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return {
          colorClass: 'bg-priority-urgent',
          textColorClass: 'theme-text-on-accent',
          text: '紧急',
          bgColorClass: 'status-error/90',
          borderColorClass: 'theme-border-error/50',
          style: {
            backgroundColor: `rgb(239, 68, 68)`, // red-500
            color: `white`,
          },
        };
      case 'high':
        return {
          colorClass: 'bg-priority-high',
          textColorClass: 'theme-text-on-accent',
          text: '高',
          bgColorClass: 'status-warning/90',
          borderColorClass: 'theme-border-warning/50',
          style: {
            backgroundColor: `rgb(249, 115, 22)`, // orange-500
            color: `white`,
          },
        };
      case 'medium':
        return {
          colorClass: 'bg-priority-medium',
          textColorClass: 'theme-text-on-accent',
          text: '中',
          bgColorClass: 'status-info/90',
          borderColorClass: 'theme-border-accent/50',
          style: {
            backgroundColor: `rgb(59, 130, 246)`, // blue-500
            color: `white`,
          },
        };
      case 'low':
        return {
          colorClass: 'bg-priority-low',
          textColorClass: 'theme-text-on-accent',
          text: '低',
          bgColorClass: 'status-success/90',
          borderColorClass: 'theme-border-success/50',
          style: {
            backgroundColor: `rgb(34, 197, 94)`, // green-500
            color: `white`,
          },
        };
      default:
        return {
          colorClass: 'theme-bg-secondary',
          textColorClass: 'theme-text-secondary',
          text: '无',
          bgColorClass: 'theme-bg-secondary/50',
          borderColorClass: 'theme-border',
          style: {},
        };
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return showText ? 'w-2 h-2' : 'w-2 h-2';
      case 'md':
        return 'w-2.5 h-2.5';
      case 'lg':
        return 'w-3 h-3';
      default:
        return 'w-2.5 h-2.5';
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5 gap-1';
      case 'md':
        return 'text-xs px-2 py-0.5 gap-1.5';
      case 'lg':
        return 'text-sm px-3 py-1 gap-2';
      default:
        return 'text-xs px-2 py-0.5 gap-1.5';
    }
  };

  const config = getPriorityConfig();

  if (showText) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded ${config.bgColorClass} ${config.textColorClass} ${config.borderColorClass} border ${getTextSizeClass()}`}
      >
        <div
          className={`${getSizeClass()} rounded-full flex-shrink-0`}
          style={{ backgroundColor: config.style.backgroundColor }}
        />
        {config.text}
      </span>
    );
  }

  return (
    <div
      className={`${getSizeClass()} rounded-full flex-shrink-0`}
      style={{ backgroundColor: config.style.backgroundColor }}
      title={`优先级: ${config.text}`}
    />
  );
};
