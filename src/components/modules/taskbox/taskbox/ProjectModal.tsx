import React, { useState, useRef, useEffect } from 'react';
import { TaskProject } from '@/types';
import { X, Edit2, Plus } from 'lucide-react';
import { IconPicker } from '@/components/common/IconPicker';
import { convertEmojiToIcon } from '@/constants/commonIcons';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; icon: string }) => void;
  project?: TaskProject | null;
  title?: string;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  project = null,
  title = '新建项目'
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [isLoading, setIsLoading] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name);
        setIcon(project.icon?.length === 1 ? convertEmojiToIcon(project.icon) : (project.icon || 'Folder'));
      } else {
        setName('');
        setIcon('Folder');
      }

      // 聚焦到输入框
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, project]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
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
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onConfirm({
        name: name.trim(),
        icon: icon
      });
      onClose();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feather-glass-modal-backdrop" onClick={handleClose}>

      {/* Modal */}
      <div 
        ref={modalRef}
        className="rounded-xl shadow-2xl max-w-sm w-full feather-glass-deco"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 theme-bg-accent/20 rounded-lg">
            {project ? (
              <Edit2 size={18} 
                className="theme-text-accent" />
            ) : (
              <Plus size={18} 
                className="theme-text-accent" />
            )}
          </div>
          <h2 className="text-lg font-medium theme-text-primary">
            {project ? '编辑项目' : title}
          </h2>
        </div>
        <button 
          onClick={handleClose} 
          disabled={isLoading}
          className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary disabled:opacity-50 feather-glass-deco"
        >
        <X size={16} />
      </button>
    </div>
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Project Name */}
        <div>
      <input ref={nameInputRef} type="text"
      value={name} onChange={(e) => setName(e.target.value)}
      onKeyDown={handleKeyDown} placeholder="输入项目名称..."
      maxLength={50}
            className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco"
      disabled={isLoading}
      required
              autoFocus />
    </div>
    <div>
      <label className="block text-sm font-medium theme-text-secondary mb-2">
        选择图标
      </label>
      <div className="rounded-lg p-3 feather-glass-deco">
        <IconPicker selectedIcon={icon} onIconSelect={setIcon}
        mode="inline"
        size="sm"
        showSearch={false} maxHeight="max-h-48"
              />
      </div>
    </div>

      </div>
      {/* Footer */}
        <div className="flex gap-3 p-4">
          <button type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary feather-glass-deco"
            disabled={isLoading}
          >
            取消
          </button>
          <button type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 theme-button-primary rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? '创建中...' : (project ? '保存修改' : '创建项目')}
          </button>
        </div>
      </div>
    </div>
  );
};










