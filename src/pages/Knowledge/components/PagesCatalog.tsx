import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useKnowledgeOperations } from '@/stores/knowledgeStore';
import { FileText, Clock } from 'lucide-react';
import { formatSmartTime } from '@/utils/timeUtils';
import type { Page } from '@/types';

interface PagesCatalogProps {
  onSelect: (pageId: string) => void;
  onCreate: () => void;
  onCreateKnowledgeBase?: () => void;
  searchQuery?: string;
  className?: string;
}

export const PagesCatalog: React.FC<PagesCatalogProps> = ({
  onSelect,
  onCreate: _onCreate,
  onCreateKnowledgeBase: _onCreateKnowledgeBase,
  searchQuery = '',
  className = '',
}) => {
  const knowledgeOps = useKnowledgeOperations();

  // 过滤页面（根据搜索条件）
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return knowledgeOps.pages;

    return knowledgeOps.pages.filter((page: any) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [knowledgeOps.pages, searchQuery]);

  // 按层级组织页面
  const organizedPages = useMemo(() => {
    const roots: Page[] = [];
    const pageMap = new Map<string, Page & { children: Page[]; level: number }>();

    // 初始化所有页面
    filteredPages.forEach((page) => {
      pageMap.set(page.id, { ...page, children: [], level: 0 });
    });

    // 构建层级关系
    filteredPages.forEach((page) => {
      if (!page.parent_id) {
        roots.push(page);
      } else if (pageMap.has(page.parent_id)) {
        const parent = pageMap.get(page.parent_id)!;
        const child = pageMap.get(page.id)!;
        child.level = parent.level + 1;
        parent.children.push(page);
      } else {
        // 如果父页面不在筛选结果中，当作根页面处理
        roots.push(page);
      }
    });

    // 按排序和修改时间排序
    const sortPages = (pageList: Page[]) => {
      return pageList.sort((a, b) => {
        // 先按sort_order排序，然后按更新时间
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return b.updated_at - a.updated_at;
      });
    };

    return sortPages(roots).map((page) => ({
      ...pageMap.get(page.id)!,
      children: sortPages(pageMap.get(page.id)?.children || []),
    }));
  }, [filteredPages]);

  // 渲染单个页面项
  const renderPageItem = (page: Page & { children: Page[]; level: number }) => {
    const hasChildren = page.children.length > 0;

    return (
      <div key={page.id}>
        {/* 页面项 */}
        <div
          className={cn(
            'flex items-center justify-between py-2 px-3 hover:bg-white/5 cursor-pointer transition-colors group',
            page.level > 0 && 'ml-6'
          )}
          onClick={() => onSelect(page.id)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-4 h-4 theme-text-tertiary flex-shrink-0" />
            <span className="text-sm theme-text-primary truncate">{page.title}</span>
            {hasChildren && (
              <span className="text-xs text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded">
                {page.children.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs theme-text-tertiary">
            <Clock className="w-3 h-3" />
            <span className="font-mono whitespace-nowrap">{formatSmartTime(page.updated_at)}</span>
          </div>
        </div>
        {/* 子页面（递归渲染） */}
        {hasChildren && (
          <div>
            {page.children.map((child) =>
              renderPageItem({ ...child, children: [], level: page.level + 1 })
            )}
          </div>
        )}
      </div>
    );
  };

  // 如果没有知识库，显示空状态
  if (!knowledgeOps.currentKnowledgeBase) {
    return (
      <div
        className={cn('flex items-center justify-center h-full theme-knowledge-glass', className)}
      >
        <div className="text-center p-8">
          <FileText className="w-12 h-12 theme-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium theme-text-primary mb-2">知识目录</h3>
          <p className="theme-text-secondary text-sm">选择或创建一个知识库来开始整理你的想法</p>
        </div>
      </div>
    );
  }

  // 如果没有页面，显示创建提示
  if (filteredPages.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center h-full theme-knowledge-glass', className)}
      >
        <div className="text-center max-w-sm mx-auto p-6 sm:p-8">
          {/* 标题和描述 */}
          <h3 className="text-base sm:text-lg font-medium theme-text-primary mb-2">
            {searchQuery ? '没有找到匹配的页面' : '开始创建你的第一个页面'}
          </h3>
          <p className="theme-text-secondary text-sm mb-4 sm:mb-6 leading-relaxed">
            {searchQuery
              ? `没有找到包含 "${searchQuery}" 的页面，试试其他关键词吧`
              : '在这个知识库中记录你的想法、笔记和灵感'}
          </p>
          {!searchQuery && (
            <p className="text-xs theme-text-tertiary text-center">
              使用右上角的"新建页面"按钮开始创建
            </p>
          )}
        </div>
      </div>
    );
  }

  // 渲染页面目录
  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* 页面列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-4 px-4">
          <div className="space-y-1">{organizedPages.map((page) => renderPageItem(page))}</div>
        </div>
      </div>
    </div>
  );
};
