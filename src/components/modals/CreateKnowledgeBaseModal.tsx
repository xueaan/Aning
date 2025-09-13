import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useKnowledgeOperations } from '@/stores';
import { IconPicker } from '@/components/common/IconPicker';

interface CreateKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateKnowledgeBaseModal: React.FC<CreateKnowledgeBaseModalProps> = ({
  isOpen,
  onClose
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
        updated_at: Date.now()
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
    <div className="feather-glass-modal-backdrop" onClick={handleClose}>
      {/* 弹窗内容 */}
      <div className="feather-glass-modal w-full max-w-md rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b theme-border-primary">
          <h2 className="text-lg font-medium theme-text-primary">
            创建知识库
          </h2>
          <button onClick={handleClose}
            className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary feather-glass-nav"
          >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSave} 
            className="p-4 space-y-4">
        {/* 知识库名称 */}
        <div>
          <input type="text"
            value={name} onChange={(e) => setName(e.target.value)}
          placeholder="输入知识库名称..."
          
            className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-content"
          required
          maxLength={50}
          autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-2">
            选择图标
          </label>
          <div className="rounded-lg p-3 feather-glass-content">
            <IconPicker selectedIcon={selectedIcon} onIconSelect={setSelectedIcon}
            mode="inline"
            size="sm"
            showSearch={false} maxHeight="max-h-48"
              />
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <button type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary feather-glass-nav"
          disabled={isLoading}
            >
          取消
        </button>
        <button type="submit"
            className="flex-1 px-4 py-3 theme-button-primary rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50"
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? '创建中...' : '创建'}
        </button>
        </div>
      </form>
    </div>
    </div>
  );
};









