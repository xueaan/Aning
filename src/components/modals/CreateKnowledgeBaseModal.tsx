import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useKnowledgeOperations } from '@/stores';
import { IconPicker } from '@/components/common/IconPicker';

interface CreateKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateKnowledgeBaseModal: React.FC<CreateKnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createKnowledgeBase, setCurrentKnowledgeBase } = useKnowledgeOperations();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Book');
  const [isLoading, setIsLoading] = useState(false);

  // 重置表单
  const resetForm = () => {
    setName('');
    setSelectedIcon('Book');
    setIsLoading(false);
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const id = await createKnowledgeBase(name.trim());

      // 切换到新创建的知识库
      const newKB = {
        id,
        name: name.trim(),
        icon: selectedIcon,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      setCurrentKnowledgeBase(newKB);
      handleClose();
    } catch (error) {
      console.error('创建知识库失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md rounded-xl p-6 shadow-2xl feather-glass-deco"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* 头部 - 简化设计 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium theme-text-primary">创建知识库</h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary"
              disabled={isLoading}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 知识库名称 */}
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                知识库名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入知识库名称..."
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:theme-ring-accent focus:scale-[1.02] transition-all duration-200 theme-text-primary placeholder:theme-text-tertiary feather-glass-input border border-transparent hover:border-accent/20"
                required
                maxLength={50}
                autoFocus
              />
            </div>

            {/* 图标选择 */}
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-3">
                选择图标
              </label>
              <div className="rounded-xl p-4 feather-glass-deco border border-transparent hover:border-accent/10 transition-colors">
                <IconPicker
                  selectedIcon={selectedIcon}
                  onIconSelect={setSelectedIcon}
                  mode="inline"
                  size="md"
                  showSearch={false}
                  maxHeight="max-h-56"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-sm border theme-border rounded-lg hover:theme-border-hover theme-text-secondary hover:theme-text-primary transition-all duration-200 hover:scale-[1.02]"
                disabled={isLoading}
              >
                取消
              </button>
              <motion.button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="flex-1 px-6 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed theme-bg-accent hover:theme-bg-accent-hover theme-text-on-accent transition-all duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '创建中...' : '创建'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
