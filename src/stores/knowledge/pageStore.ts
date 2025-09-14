import { create } from 'zustand';
import { DatabaseAPI } from '@/services/api/database';
import type { Page } from '@/types';

// 页面树节点类型
export interface TreeNode extends Page {
  children: TreeNode[];
  hasChildren: boolean;
  isExpanded?: boolean;
  level?: number;
}

// 面包屑项目类型
export interface BreadcrumbItem {
  id: string;
  title: string;
  level?: number;
}

interface PageState {
  pages: Page[];
  pageTree: TreeNode[];
  currentPage: Page | null;
  breadcrumb: BreadcrumbItem[];
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  isLoading: boolean;
}

interface PageActions {
  // 页面CRUD操作
  loadPages: (knowledgeBaseId: string, parentId?: string) => Promise<void>;
  createPage: (knowledgeBaseId: string, title: string, parentId?: string) => Promise<string>;
  updatePage: (id: string, title?: string, parentId?: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  movePage: (pageId: string, newParentId?: string, newOrderIndex?: number) => Promise<void>;
  
  // 页面导航
  setCurrentPage: (page: Page | null) => void;
  buildBreadcrumb: (pageId: string) => void;
  
  // 树形视图操作
  toggleExpansion: (pageId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  buildPageTree: () => void;
  
  // 选择操作
  toggleSelection: (pageId: string) => void;
  clearSelection: () => void;
  selectMultiple: (pageIds: string[]) => void;
}

export interface PageStore extends PageState, PageActions {}

export const usePageStore = create<PageStore>((set, get) => ({
  // State
  pages: [],
  pageTree: [],
  currentPage: null,
  breadcrumb: [],
  expandedIds: new Set(),
  selectedIds: new Set(),
  isLoading: false,

  // Actions
  loadPages: async (knowledgeBaseId: string) => {
    set({ isLoading: true });
    try {
      // 始终获取知识库下的所有页面，然后在前端构建树结构
      const pages = await DatabaseAPI.getAllPages(knowledgeBaseId);
      set({ pages, isLoading: false });
      get().buildPageTree();
    } catch (error) {
      console.error('加载页面失败:', error);
      set({ isLoading: false });
    }
  },

  createPage: async (knowledgeBaseId: string, title: string, parentId?: string) => {
    
    try {
      const id = await DatabaseAPI.createPage(knowledgeBaseId, title, parentId);
      
      // 重新加载页面数据确保一致性
      await get().loadPages(knowledgeBaseId);
      
      return id;
    } catch (error) {
      console.error('❌ pageStore.createPage 失败:', error);
      throw error;
    }
  },

  updatePage: async (id: string, title?: string, parentId?: string) => {
    try {
      await DatabaseAPI.updatePage(id, title, parentId);
      
      // 获取当前知识库ID并重新加载数据确保一致性
      const knowledgeBaseId = get().pages.find(p => p.id === id)?.kb_id;
      if (knowledgeBaseId) {
        await get().loadPages(knowledgeBaseId);
      }
    } catch (error) {
      console.error('更新页面失败:', error);
      throw error;
    }
  },

  deletePage: async (id: string) => {
    try {
      // 获取当前知识库ID在删除前
      const knowledgeBaseId = get().pages.find(p => p.id === id)?.kb_id;
      
      await DatabaseAPI.deletePage(id);
      
      // 清除当前页面如果被删除的是当前页面
      set(state => ({
        currentPage: state.currentPage?.id === id ? null : state.currentPage
      }));
      
      // 重新加载数据确保一致性
      if (knowledgeBaseId) {
        await get().loadPages(knowledgeBaseId);
      }
    } catch (error) {
      console.error('删除页面失败:', error);
      throw error;
    }
  },

  movePage: async (pageId: string, newParentId?: string, newOrderIndex?: number) => {
    try {
      await DatabaseAPI.movePage(pageId, newParentId, newOrderIndex);
      await get().loadPages(get().pages.find(p => p.id === pageId)?.kb_id || '');
    } catch (error) {
      console.error('移动页面失败:', error);
      throw error;
    }
  },

  setCurrentPage: (page: Page | null) => {
    set({ currentPage: page });
    if (page) {
      get().buildBreadcrumb(page.id);
    } else {
      set({ breadcrumb: [] });
    }
  },

  buildBreadcrumb: (pageId: string) => {
    const { pages } = get();
    const breadcrumb: BreadcrumbItem[] = [];
    
    let currentPage = pages.find(p => p.id === pageId);
    while (currentPage) {
      breadcrumb.unshift({
        id: currentPage.id,
        title: currentPage.title
      });
      currentPage = currentPage.parent_id ? pages.find(p => p.id === currentPage!.parent_id) : undefined;
    }
    
    set({ breadcrumb });
  },

  toggleExpansion: (pageId: string) => {
    set(state => {
      const newExpandedIds = new Set(state.expandedIds);
      if (newExpandedIds.has(pageId)) {
        newExpandedIds.delete(pageId);
      } else {
        newExpandedIds.add(pageId);
      }
      return { expandedIds: newExpandedIds };
    });
  },

  expandAll: () => {
    const { pages } = get();
    const expandedIds = new Set(pages.map(p => p.id));
    set({ expandedIds });
  },

  collapseAll: () => {
    set({ expandedIds: new Set() });
  },

  buildPageTree: () => {
    const { pages, expandedIds } = get();
    
    // 构建页面树的递归函数
    const buildTree = (parentId?: string, level = 0): TreeNode[] => {
      return pages
        .filter(page => {
          // 如果查找根节点（parentId为undefined），匹配parent_id为空的页面
          if (parentId === undefined) {
            return !page.parent_id; // null, undefined, 空字符串都算根节点
          }
          // 如果查找子节点，严格匹配parent_id
          return page.parent_id === parentId;
        })
        .map(page => {
          const children = buildTree(page.id, level + 1);
          return {
            ...page,
            children,
            hasChildren: children.length > 0,
            isExpanded: expandedIds.has(page.id),
            level
          };
        });
    };
    
    const pageTree = buildTree();
    set({ pageTree });
  },

  toggleSelection: (pageId: string) => {
    set(state => {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(pageId)) {
        newSelectedIds.delete(pageId);
      } else {
        newSelectedIds.add(pageId);
      }
      return { selectedIds: newSelectedIds };
    });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  selectMultiple: (pageIds: string[]) => {
    set({ selectedIds: new Set(pageIds) });
  }
}));