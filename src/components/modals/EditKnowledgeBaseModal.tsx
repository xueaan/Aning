import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useKnowledgeOperations } from '@/stores';
import type { KnowledgeBase } from '@/types';
import { IconPicker } from '@/components/common/IconPicker';
import { convertEmojiToIcon } from '@/constants/commonIcons';

interface EditKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBase: KnowledgeBase | null;
}

export const EditKnowledgeBaseModal: React.FC<EditKnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase,
}) => {
  const { updateKnowledgeBase } = useKnowledgeOperations();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Book');
  const [isLoading, setIsLoading] = useState(false);

  // 当知识库数据变化时，更新表单状态
  useEffect(() => {
    if (knowledgeBase && isOpen) {
      setName(knowledgeBase.name || '');
      setSelectedIcon(
        knowledgeBase.icon?.length === 1
          ? convertEmojiToIcon(knowledgeBase.icon)
          : knowledgeBase.icon || 'Book'
      );
    }
  }, [knowledgeBase, isOpen]);

  // 重置表单
  const resetForm = () => {
    setName('');
    setSelectedIcon('Book');
    setIsLoading(false);
  };

  // 处理关闭
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  // 处理保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !knowledgeBase) return;

    setIsLoading(true);
    try {
      await updateKnowledgeBase(knowledgeBase.id, name.trim(), selectedIcon);
      handleClose();
    } catch (error) {
      console.error('更新知识库失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !knowledgeBase) return null;

  return (
    <div className="feather-glass-modal-backdrop" onClick={handleClose}>
      {/* 弹窗内容 - 使用轻羽毛玻璃确保内容可读 */}
      <div
        className="feather-glass-modal w-full max-w-md rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b theme-border-primary">
          <h2 className="text-lg font-medium theme-text-primary">编辑知识库</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary feather-glass-nav"
            disabled={isLoading}
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {/* 知识库名称 */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入知识库名称..."
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-content"
              required
              maxLength={50}
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text-secondary mb-2">选择图标</label>
            <div className="rounded-lg p-3 feather-glass-content">
              <IconPicker
                selectedIcon={selectedIcon}
                onIconSelect={setSelectedIcon}
                mode="inline"
                size="sm"
                showSearch={false}
                maxHeight="max-h-48"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary feather-glass-nav"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 theme-button-primary rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
