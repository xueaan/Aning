import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores';
import { Edit2, Trash2, Plus, Copy, RefreshCw, Settings, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KnowledgeBase } from '@/types';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface KnowledgeBaseContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  knowledgeBase: KnowledgeBase | null;
  onClose: () => void;
  onEdit: (kb: KnowledgeBase) => void;
  onDelete: (kb: KnowledgeBase) => void;
  onCreate: () => void;
  onExport?: (kb: KnowledgeBase) => void;
  onDuplicate?: (kb: KnowledgeBase) => void;
  onSettings?: (kb: KnowledgeBase) => void;
  onRefresh?: () => void;
}

export const KnowledgeBaseContextMenu: React.FC<KnowledgeBaseContextMenuProps> = ({
  isVisible,
  position,
  knowledgeBase,
  onClose,
  onEdit,
  onDelete,
  onCreate,
  onExport,
  onDuplicate,
  onSettings,
  onRefresh
}) => {
  const { /* theme */ } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // const isDark = theme === 'dark';

  // 调整菜单位置以防超出屏幕边界
  useEffect(() => {
    if (isVisible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // 防止菜单超出右边界
      if (newX + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }

      // 防止菜单超出下边界
      if (newY + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10;
      }

      // 防止菜单超出左边界和上边界
      newX = Math.max(10, newX);
      newY = Math.max(10, newY);

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isVisible, position]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !knowledgeBase) {
    return null;
  }

  const menuItems: MenuItem[] = [
    {
      id: 'create-page',
      label: '新建页面',
      icon: <Plus className="w-4 h-4" />,
      onClick: () => {
        onCreate();
        onClose();
      }
    },
    {
      id: 'divider-1',
      label: '',
      icon: null,
      onClick: () => {},
      divider: true
    },
    {
      id: 'edit',
      label: '编辑知识库',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => {
        onEdit(knowledgeBase);
        onClose();
      }
    },
    {
      id: 'duplicate',
      label: '复制知识库',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => {
        onDuplicate?.(knowledgeBase);
        onClose();
      }
    },
    {
      id: 'settings',
      label: '知识库设置',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {
        onSettings?.(knowledgeBase);
        onClose();
      }
    },
    {
      id: 'divider-2',
      label: '',
      icon: null,
      onClick: () => {},
      divider: true
    },
    {
      id: 'export',
      label: '导出知识库',
      icon: <Download className="w-4 h-4" />,
      onClick: () => {
        onExport?.(knowledgeBase);
        onClose();
      }
    },
    {
      id: 'refresh',
      label: '刷新数据',
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: () => {
        onRefresh?.();
        onClose();
      }
    },
    {
      id: 'divider-3',
      label: '',
      icon: null,
      onClick: () => {},
      divider: true
    },
    {
      id: 'delete',
      label: '删除知识库',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        onDelete(knowledgeBase);
        onClose();
      },
      danger: true
    }
  ];

  return (
    <div ref={menuRef}
            className={cn('fixed z-50 min-w-48 rounded-lg shadow-lg border backdrop-blur-sm',
        'theme-bg-secondary/95 theme-border'
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* 菜单头部 */}
      <div className={cn('px-4 py-3 border-b text-sm font-medium truncate',
        'theme-border theme-text-primary'
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{knowledgeBase.icon || '📚'}</span>
          <span className="truncate">{knowledgeBase.name}</span>
        </div>
      </div>
      <div className="py-1">
        {menuItems.map((item) => {
          if (item.divider) {
            return (
              <div key={item.id}
            className={cn(
                  'mx-2 my-1 h-px',
                  'theme-border'
                )}
              />
            );
          }

          return (
            <button key={item.id} onClick={item.onClick}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                item.danger
                  ? 'text-status-error hover:bg-status-error/10 hover:text-status-error/80'
                  : 'theme-text-primary hover:theme-bg-hover hover:theme-text-primary'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
    </div>
    </div>
  );
};









