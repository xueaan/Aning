import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Check } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  content?: string;
  itemName?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "确认删除",
  message,
  content,
  itemName,
  isLoading = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 默认消息
  const defaultMessage = itemName
    ? `确定要删除"${itemName}"吗？此操作无法撤销。`
    : "确定要删除这个项目吗？此操作无法撤销。";

  const displayMessage = content || message || defaultMessage;

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            ref={modalRef}
            className="w-full max-w-md rounded-2xl shadow-2xl theme-bg-primary/95 backdrop-blur-xl theme-border"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b theme-border-primary">
              <div className="flex items-center gap-3">
                <div className="p-2 theme-bg-error/20 rounded-lg">
                  <Trash2 
                    size={18}
                    className="theme-text-error" 
                  />
                </div>
                <h2 className="text-lg font-medium theme-text-primary">
                  {title}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                disabled={isLoading}
                className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary disabled:opacity-50 feather-glass-panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="theme-text-secondary text-sm leading-relaxed">
                {displayMessage}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-4">
              <button 
                type="button"
                onClick={onClose} 
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary disabled:opacity-50 feather-glass-panel"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={onConfirm} 
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50 theme-bg-error hover:theme-bg-error-hover theme-text-on-error font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    确认删除
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-4 pt-0">
              <div className="text-xs theme-text-tertiary text-center">
                按 <kbd className="px-1.5 py-0.5 text-[10px] font-mono theme-bg-secondary border theme-border rounded">Esc</kbd> 取消，
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono theme-bg-secondary border theme-border rounded">Ctrl+Enter</kbd> 确认
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};