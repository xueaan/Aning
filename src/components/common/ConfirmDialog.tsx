import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  isLoading = false
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-status-error/10',
          iconColor: 'text-status-error',
          confirmBg: 'bg-status-error hover:bg-status-error/80',
          confirmText: 'text-white'
        };
      case 'warning':
        return {
          iconBg: 'bg-status-warning/10',
          iconColor: 'text-status-warning',
          confirmBg: 'bg-status-warning hover:bg-status-warning/80',
          confirmText: 'text-white'
        };
      case 'info':
        return {
          iconBg: 'bg-status-info/10',
          iconColor: 'text-status-info',
          confirmBg: 'bg-status-info hover:bg-status-info/80',
          confirmText: 'text-white'
        };
      default:
        return {
          iconBg: 'bg-status-error/10',
          iconColor: 'text-status-error',
          confirmBg: 'bg-status-error hover:bg-status-error/80',
          confirmText: 'text-white'
        };
    }
  };

  if (!isOpen) return null;

  const config = getTypeConfig();

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div 
        ref={dialogRef}
        className="relative bg-bg-secondary border border-border-primary rounded-xl shadow-2xl max-w-sm w-full mx-auto"
      >
        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 p-2.5 rounded-full ${config.iconBg}`}>
              <AlertTriangle 
                size={20}
                className={config.iconColor} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {title}
              </h3>
              <p className="theme-text-secondary text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border-primary bg-bg-tertiary rounded-b-xl">
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2 theme-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm} 
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBg} ${config.confirmText}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};