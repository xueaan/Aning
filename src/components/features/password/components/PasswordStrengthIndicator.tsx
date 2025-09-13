import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  strength: {
    level: 'weak' | 'fair' | 'good' | 'strong';
    score: number;
  } | null;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ strength }) => {
  if (!strength) return null;

  const getLevelText = (level: string) => {
    switch (level) {
      case 'weak': return '弱';
      case 'fair': return '一般';
      case 'good': return '良好';
      case 'strong': return '强';
      default: return '';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'weak': return 'theme-text-error';
      case 'fair': return 'text-yellow-500';
      case 'good': return 'theme-text-accent';
      case 'strong': return 'theme-text-success';
      default: return '';
    }
  };

  const getBarColor = (level: string) => {
    switch (level) {
      case 'weak': return 'status-error';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'theme-bg-accent';
      case 'strong': return 'status-success';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="theme-text-secondary">密码强度:</span>
        <span className={cn('font-medium', getLevelColor(strength.level))}>
          {getLevelText(strength.level)}
        </span>
      </div>
      <div className="w-full theme-bg-tertiary rounded-full h-1.5">
        <div 
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            getBarColor(strength.level)
          )} 
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  );
};