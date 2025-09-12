import React from 'react';
import { useToastStore } from '@/stores/toastStore';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check size={20} 
            className="text-status-success" />;
      case 'error':
        return <X size={20} 
            className="text-status-error" />;
      case 'warning':
        return <AlertTriangle size={20} 
            className="text-status-warning" />;
      default:
        return <Info size={20} 
            className="text-status-info" />;
    }
  };

  const getBackgroundClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'feather-glass-panel border-status-success/30';
      case 'error':
        return 'feather-glass-panel border-status-error/30';
      case 'warning':
        return 'feather-glass-panel border-status-warning/30';
      default:
        return 'feather-glass-panel border-status-info/30';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-8 right-8 z-[10000] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg shadow-lg animate-slideInRight ${getBackgroundClass(toast.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold text-text-primary mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm theme-text-secondary">
              {toast.message}
            </p>
          </div>
          <button onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 rounded hover:bg-hover-bg transition-colors"
            aria-label="关闭"
          >
            <X size={16} 
            className="text-text-tertiary" />
          </button>
        </div>
      ))}
    </div>
  );
};







