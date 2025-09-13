import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKnowledgeOperations } from '@/stores';
import { X, Edit2 } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
  pageId: string;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pageId
}) => {
  // Store references removed - themeMode cleanup
  const { pages } = useKnowledgeOperations();
  const [title, setTitle] = useState('');

  const page = pages.find(p => p.id === pageId);

  useEffect(() => {
    if (isOpen && page) {
      setTitle(page.title || '');
    }
  }, [isOpen, page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onConfirm(title.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-[400px] rounded-xl shadow-2xl bg-bg-primary/90 backdrop-blur-md border border-border-primary/50"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-border-primary/20">
              <div className="flex items-center gap-3">
                <Edit2 size={20} className="text-accent" />
                <h3 className="text-lg font-medium theme-text-primary">
                  重命名页面
                </h3>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary/20"
              >
                <X size={16} />
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-4">
              <label className="block text-sm font-medium mb-2 theme-text-secondary">
                页面标题
              </label>
              <input 
                type="text"
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown} 
                placeholder="请输入页面标题..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg border outline-none transition-colors theme-bg-secondary/20 theme-border theme-text-primary theme-placeholder focus:theme-border-accent focus:theme-bg-secondary/40"
              />
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-border-primary/20">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium transition-colors theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary/20"
              >
                取消
              </button>
              <button 
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-bg-accent theme-text-on-accent hover:theme-bg-accent-hover disabled:hover:theme-bg-accent"
              >
                确认重命名
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};