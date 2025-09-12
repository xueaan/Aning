import { useEffect } from 'react';
import { useDialogStore } from '@/stores/dialogStore';
import { X, Check, AlertTriangle, Info } from 'lucide-react';

export const ConfirmDialog: React.FC = () => {
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    type,
    confirm,
    cancel
  } = useDialogStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        cancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, cancel]);

  if (!isOpen) return null;

  const getTypeIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} 
            className="text-status-warning" style={{ color: 'rgba(var(--status-warning), 1)' }} />;
      case 'danger':
        return <X size={24} 
            className="text-status-error" style={{ color: 'rgba(var(--status-error), 1)' }} />;
      case 'success':
        return <Check size={24} 
            className="text-status-success" style={{ color: 'rgba(var(--status-success), 1)' }} />;
      default:
        return <Info size={24} 
            className="text-status-info" style={{ color: 'rgba(var(--status-info), 1)' }} />;
    }
  };

  const getConfirmButtonClass = () => {
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-all duration-200 ";
    switch (type) {
      case 'danger':
        return baseClass + "status-error status-error-hover theme-text-on-accent";
      case 'warning':
        return baseClass + "status-warning status-warning-hover theme-text-on-accent";
      case 'success':
        return baseClass + "status-success status-success-hover theme-text-on-accent";
      default:
        return baseClass + "theme-bg-accent hover:theme-bg-accent-hover theme-text-on-accent";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      onClick={cancel}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 对话框 */}
      <div className={`relative max-w-md w-full rounded-xl shadow-2xl animate-scaleIn feather-glass-content border border-border-primary/50`} onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          </div>
          <button onClick={cancel}
            className="p-1 rounded hover:bg-hover-bg transition-colors"
          aria-label="关闭"
          >
          <X size={20} 
            className="text-text-tertiary" />
        </button>
      </div>
      <div className="p-6">
        <p className="theme-text-secondary leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-end gap-3 p-4 border-t border-border-primary">
        <button onClick={cancel}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 glass-input hover:bg-hover-bg theme-text-secondary`}
          >
        {cancelText}
      </button>
      <button onClick={confirm}
            className={getConfirmButtonClass()}
      autoFocus
          >
      {confirmText}
    </button>
        </div>
      </div>
    </div>
  );
};









