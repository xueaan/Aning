import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, FileText, Plus } from 'lucide-react';
import { Edit2, Trash2 } from 'lucide-react';
import { useCardBoxStore } from '@/stores';
import { cn } from '@/lib/utils';
import { getIconComponent, isValidIcon } from '@/constants/commonIcons';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { CardBox } from '@/types';

interface CardBoxSelectorProps {
  className?: string;
  onCreateCardBox?: () => void;
  onEditCardBox?: (cardBox: CardBox) => void;
}

export const CardBoxSelector: React.FC<CardBoxSelectorProps> = ({
  className = '',
  onCreateCardBox,
  onEditCardBox
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    boxes,
    activeBoxId,
    selectBox,
    deleteBox
  } = useCardBoxStore();

  // 删除确认相关状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardBox | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取当前选中的笔记盒
  const currentBox = boxes.find(box => box.id === activeBoxId);

  // 过滤笔记盒
  const filteredBoxes = boxes.filter(box =>
    box.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 渲染图标
  const renderIcon = (iconName?: string) => {
    if (!iconName) {
      return null;
    }

    const trimmedIconName = iconName.trim();

    // 如果是有效的图标名称，返回React组件
    if (isValidIcon(trimmedIconName)) {
      const IconComponent = getIconComponent(trimmedIconName);
      return <IconComponent size={16} className="theme-text-primary" />;
    }

    // 如果不是有效图标名称，可能是emoji，直接返回
    return <span className="text-sm">{trimmedIconName}</span>;
  };

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

  // 关闭下拉框
  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  // 开关下拉菜单
  const toggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
      setIsOpen(true);
    } else {
      closeDropdown();
    }
  };

  // 选择笔记盒
  const handleSelectBox = (boxId: string | null) => {
    selectBox(boxId);
    closeDropdown();
  };

  // 处理编辑笔记盒
  const handleEdit = (e: React.MouseEvent, cardBox: CardBox) => {
    e.stopPropagation();
    onEditCardBox?.(cardBox);
    closeDropdown();
  };

  // 处理删除笔记盒
  const handleDelete = (e: React.MouseEvent, cardBox: CardBox) => {
    e.stopPropagation();
    setDeleteTarget(cardBox);
    setShowDeleteConfirm(true);
    closeDropdown();
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteBox(deleteTarget.id);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('删除笔记盒失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 聚焦搜索框
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)}>
      {/* 选择器按钮 */}
      <button 
        ref={buttonRef}
        onClick={toggleDropdown}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 text-sm font-normal rounded transition-all duration-200',
          'min-w-[120px] max-w-[280px] theme-text-primary h-8',
          'hover:scale-[1.02] active:scale-[0.98] feather-glass-deco'
        )}
      >
        {currentBox ? (
          <>
            <div className="flex items-center justify-center flex-shrink-0">
              {renderIcon(currentBox.icon)}
            </div>
            <span className="truncate theme-text-primary">{currentBox.name}</span>
          </>
        ) : (
          <>
            <FileText size={16} className="theme-text-secondary flex-shrink-0" />
            <span className="theme-text-primary">全部笔记</span>
          </>
        )}
        <ChevronDown 
          className={cn(
            'w-4 h-4 theme-text-secondary transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] rounded-xl shadow-2xl max-h-80 overflow-hidden w-80 feather-glass-deco"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {/* 搜索框 */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-tertiary" />
              <input 
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索笔记盒..."
                className="w-full pl-10 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent theme-text-primary placeholder:theme-text-tertiary transition-all duration-200 feather-glass-deco"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {/* 全部笔记选项 */}
            <button 
              onClick={() => handleSelectBox(null)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all duration-200',
                'hover:bg-white/10 dark:hover:bg-white/5',
                activeBoxId === null && 'theme-bg-accent/20 theme-text-accent'
              )}
            >
              <FileText className="w-4 h-4 theme-text-secondary" />
              <div className="flex-1">
                <span className="font-medium">全部笔记</span>
                <div className="text-xs theme-text-tertiary mt-0.5">
                  {boxes.reduce((sum, box) => sum + (box.cards_count || 0), 0)} 篇笔记
                </div>
              </div>
            </button>

            {filteredBoxes.length > 0 ? (
              filteredBoxes.map((box) => (
                <div 
                  key={box.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 transition-all duration-200 group',
                    'hover:bg-white/10 dark:hover:bg-white/5',
                    activeBoxId === box.id && 'theme-bg-accent/20'
                  )}
                >
                  <button 
                    onClick={() => handleSelectBox(box.id)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    <div className="flex items-center justify-center flex-shrink-0">
                      {renderIcon(box.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium theme-text-primary truncate block">
                        {box.name}
                      </span>
                      {box.description && (
                        <div className="text-xs theme-text-tertiary mt-0.5 truncate">
                          {box.description}
                        </div>
                      )}
                    </div>
                    {activeBoxId === box.id && (
                      <div className="w-1.5 h-1.5 rounded-full theme-bg-accent flex-shrink-0" />
                    )}
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {/* 编辑按钮 */}
                    <button 
                      onClick={(e) => handleEdit(e, box)}
                      className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity theme-text-tertiary hover:theme-text-accent hover:bg-white/10"
                      title={`编辑笔记盒 "${box.name}"`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, box)}
                      className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity theme-text-tertiary hover:theme-text-error hover:bg-white/10"
                      title={`删除笔记盒 "${box.name}"`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : searchQuery && filteredBoxes.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="text-sm theme-text-tertiary">没有找到匹配的笔记盒</div>
              </div>
            ) : null}

            {/* 创建新笔记盒选项 */}
            {onCreateCardBox && (
              <>
                <div className="border-t theme-border mx-2 my-2" />
                <button 
                  onClick={() => {
                    onCreateCardBox();
                    closeDropdown();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all duration-200 hover:bg-white/10 dark:hover:bg-white/5 theme-text-accent"
                >
                  <div className="w-4 h-4 rounded-md theme-bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Plus size={12} />
                  </div>
                  <span className="font-medium">创建新笔记盒</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="删除笔记盒"
        itemName={deleteTarget?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};