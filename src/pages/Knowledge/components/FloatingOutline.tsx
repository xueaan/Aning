import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { type OutlineItem } from './HeadingExtractor';

interface FloatingOutlineProps {
  headings: OutlineItem[];
  onHeadingClick?: (id: string) => void;
  activeHeadingId?: string | null;
  className?: string;
  isExpanded?: boolean;
  onClose?: () => void;
}

export const FloatingOutline: React.FC<FloatingOutlineProps> = ({
  headings,
  onHeadingClick,
  activeHeadingId,
  className = '',
  isExpanded: controlledExpanded,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 使用受控展开状态
  const actualIsExpanded = controlledExpanded !== undefined ? controlledExpanded : isExpanded;

  // 自动展开所有大纲项
  useEffect(() => {
    if (headings.length > 0) {
      const getAllIds = (items: OutlineItem[]): string[] => {
        const ids: string[] = [];
        items.forEach(item => {
          ids.push(item.id);
          if (item.children) {
            ids.push(...getAllIds(item.children));
          }
        });
        return ids;
      };
      setExpandedIds(new Set(getAllIds(headings)));
    }
  }, [headings]);

  // 切换大纲项展开状态
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // 处理标题点击
  const handleHeadingClick = (id: string) => {
    onHeadingClick?.(id);
  };

  // 渲染大纲项
  const renderOutlineItem = (item: OutlineItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);
    const isActive = activeHeadingId === item.id;
    const paddingLeft = depth * 16;

    return (
      <div key={item.id}>
        <div 
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-200 text-sm group',
            'hover:theme-bg-secondary hover:backdrop-blur-sm',
            isActive
              ? 'theme-bg-accent theme-text-accent shadow-sm backdrop-blur-sm'
              : 'theme-text-secondary hover:theme-text-primary'
          )} 
          style={{ paddingLeft }}
        >
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className={cn(
                'p-0.5 rounded transition-colors',
                'hover:theme-bg-secondary hover:backdrop-blur-sm',
                'theme-text-secondary hover:theme-text-primary'
              )}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3 -rotate-90" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          <span 
            onClick={() => handleHeadingClick(item.id)}
            className="flex-1 truncate"
          >
            {item.text}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children?.map(child => renderOutlineItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 如果没有标题，不显示组件
  if (headings.length === 0) {
    return null;
  }

  return (
    <div className={cn('fixed top-24 right-4 z-50 transition-all duration-300', className)}>
      {!actualIsExpanded ? (
        // 折叠状态：显示"Show Outline"按钮 (只在非受控模式下显示)
        controlledExpanded === undefined && (
          <button 
            onClick={() => setIsExpanded(true)} 
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-md transition-all duration-200 text-sm',
              'theme-bg-secondary/90 theme-text-secondary theme-border',
              'hover:theme-bg-secondary hover:theme-text-primary hover:shadow-xl hover:scale-105',
              'border backdrop-blur-sm'
            )}
          >
            <Eye className="w-4 h-4" />
            <span>大纲</span>
          </button>
        )
      ) : (
        // 展开状态：显示大纲内容
        <div className={cn(
          'theme-bg-primary/95 backdrop-blur-md rounded-lg shadow-2xl w-64 max-h-96 overflow-hidden',
          'border theme-border'
        )}>
          {/* 头部 */}
          <div className={cn(
            'flex items-center justify-between px-3 py-2.5 theme-border border-b backdrop-blur-sm'
          )}>
            <span className="text-sm font-semibold theme-text-primary">大纲</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setIsExpanded(false);
                  }
                }}
                className={cn(
                  'p-1 rounded transition-all duration-200',
                  'hover:theme-bg-secondary hover:backdrop-blur-sm',
                  'theme-text-secondary hover:theme-text-primary'
                )} 
                title="收起"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {/* 大纲内容 */}
          <div className="p-2 overflow-y-auto max-h-80 scrollbar-thin">
            {headings.map(item => renderOutlineItem(item, 0))}
          </div>
        </div>
      )}
    </div>
  );
};