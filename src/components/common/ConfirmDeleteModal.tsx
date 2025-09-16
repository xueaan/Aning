import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';

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
  title = '确认删除',
  message,
  content,
  itemName,
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 默认消息
  const defaultMessage = itemName
    ? `确定要删除"${itemName}"吗？此操作无法撤销。`
    : '确定要删除这个项目吗？此操作无法撤销。';

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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <motion.div
            ref={modalRef}
            className="w-full max-w-sm rounded-xl p-4 shadow-2xl feather-glass-dropdown border-2 theme-border"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              duration: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* 简洁标题 */}
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={16} className="theme-text-error" />
              <h3 className="text-sm font-medium theme-text-primary">{title}</h3>
            </div>

            {/* 提示文字 */}
            <p className="text-xs theme-text-secondary mb-4 leading-relaxed">{displayMessage}</p>

            {/* 按钮组 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-xs rounded-lg transition-all theme-text-secondary disabled:opacity-50 feather-glass-panel hover:scale-[1.02]"
              >
                取消
              </button>
              <motion.button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-xs rounded-lg transition-all disabled:opacity-50 theme-bg-error hover:theme-bg-error-hover theme-text-on-error font-medium flex items-center justify-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                    <span>删除中...</span>
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    <span>确认删除</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // 使用 createPortal 将弹窗渲染到 document.body
  return createPortal(modalContent, document.body);
};
