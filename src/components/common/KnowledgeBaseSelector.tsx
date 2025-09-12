import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledgeStore } from '@/stores';
import type { KnowledgeBase } from '@/types';
import { getIconComponent, isValidIcon } from '@/constants/commonIcons';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface KnowledgeBaseSelectorProps {
  className?: string;
  onCreateKnowledgeBase?: () => void;
  onEditKnowledgeBase?: (kb: KnowledgeBase) => void;
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  className = '',
  onCreateKnowledgeBase,
  onEditKnowledgeBase
}) => {
  const {
    knowledgeBases,
    currentKnowledgeBase,
    setCurrentKnowledgeBase,
    deleteKnowledgeBase
  } = useKnowledgeStore();

  // 获取知识库图标，处理null/undefined/空字符串情况
  const getKnowledgeBaseIcon = (kb: typeof currentKnowledgeBase) => {
    if (!kb) return '📚';
    const iconName = kb.icon;

    // 如果没有图标名称或不是字符串，返回默认emoji
    if (!iconName || typeof iconName !== 'string' || !iconName.trim()) {
      return '📚';
    }

    const trimmedIconName = iconName.trim();

    // 如果是有效的图标名称，返回React组件
    if (isValidIcon(trimmedIconName)) {
      const IconComponent = getIconComponent(trimmedIconName);
      return <IconComponent className="text-sm" />;
    }

    // 如果不是有效图标名称，可能是emoji，直接返回
    return trimmedIconName;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 计算下拉菜单位置
  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 选择知识库
  const handleSelect = (kb: KnowledgeBase) => {
    setCurrentKnowledgeBase(kb);
    setIsOpen(false);
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent, kb: KnowledgeBase) => {
    e.stopPropagation();
    setDeleteTarget(kb);
    setShowDeleteConfirm(true);
    setIsOpen(false);
  };

  // 处理编辑知识库
  const handleEdit = (e: React.MouseEvent, kb: KnowledgeBase) => {
    e.stopPropagation();
    onEditKnowledgeBase?.(kb);
    setIsOpen(false);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteKnowledgeBase(deleteTarget.id);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('删除知识库失败', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 开关下拉菜单
  const toggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* 选择器按钮*/}
      <button ref={buttonRef}
        onClick={toggleDropdown}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 text-sm font-normal rounded transition-all duration-200',
          'min-w-[120px] max-w-[280px] theme-text-primary h-8',
          'hover:scale-[1.02] active:scale-[0.98]',
          'feather-glass-deco'
        )}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="flex-shrink-0 flex items-center">
            {getKnowledgeBaseIcon(currentKnowledgeBase)}
          </span>
          <span className="truncate theme-text-primary">
            {currentKnowledgeBase?.name || '选择知识库'}
          </span>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 theme-text-secondary transition-transform flex-shrink-0',
          isOpen && 'rotate-180'
        )}
        />
      </button>

      {isOpen && createPortal(
        <div ref={dropdownRef}
          className="fixed z-[9999] rounded-xl shadow-2xl max-h-80 overflow-hidden w-80 feather-glass-deco"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {knowledgeBases.length > 0 ? (
            <>
              {knowledgeBases.map((kb) => (
                <div key={kb.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 transition-all duration-200 group',
                    'hover:bg-white/10 dark:hover:bg-white/5',
                    currentKnowledgeBase?.id === kb.id && 'theme-bg-accent/20'
                  )}
                >
                  <button onClick={() => handleSelect(kb)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    <span className="flex-shrink-0 flex items-center">
                      {getKnowledgeBaseIcon(kb)}
                    </span>
                    <span className="text-sm font-medium truncate flex-1 theme-text-primary">
                      {kb.name}
                    </span>
                    {currentKnowledgeBase?.id === kb.id && (
                      <div className="w-1.5 h-1.5 rounded-full theme-bg-accent flex-shrink-0" />
                    )}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditKnowledgeBase && (
                      <button onClick={(e) => handleEdit(e, kb)}
                        className="p-1 rounded hover:bg-white/20 theme-text-secondary hover:theme-text-primary transition-colors"
                        title="编辑知识库"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button onClick={(e) => handleDelete(e, kb)}
                      className="p-1 rounded hover:bg-red-500/20 theme-text-secondary hover:text-red-400 transition-colors"
                      title="删除知识库"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* 分隔线 */}
              <div className="border-t border-white/10 my-1" />

              {/* 创建新知识库按钮 */}
              {onCreateKnowledgeBase && (
                <button onClick={() => {
                    onCreateKnowledgeBase();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 theme-text-secondary hover:theme-text-primary hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200"
                >
                  <Plus size={16} />
                  <span className="text-sm">新建知识库</span>
                </button>
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="theme-text-secondary text-sm mb-3">暂无知识库</p>
              {onCreateKnowledgeBase && (
                <button onClick={() => {
                    onCreateKnowledgeBase();
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg theme-bg-accent theme-text-on-accent hover:theme-bg-accent-hover transition-colors"
                >
                  <Plus size={16} />
                  <span className="text-sm font-medium">创建第一个知识库</span>
                </button>
              )}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && deleteTarget && (
        <ConfirmDeleteModal isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleConfirmDelete}
          title="删除知识库"
          content={`确定要删除知识库"${deleteTarget.name}"吗？此操作不可撤销。`}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};



