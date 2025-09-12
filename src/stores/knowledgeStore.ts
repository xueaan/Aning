import { create } from 'zustand';
import { DatabaseAPI } from '@/services/api/database';
import { DatabaseInitializer } from '@/services/database/initializer';
import type { KnowledgeBase, Block, Page } from '@/types';

// 视图模式类型
export type ViewMode = 'list' | 'card' | 'board' | 'tree';

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
  level?: number; // 添加 level 属性
}

export interface KnowledgeStore {
  // 核心数据
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: KnowledgeBase | null;
  pages: Page[];
  pageTree: TreeNode[];
  blocks: Block[];
  
  // 当前状态
  currentId: string | null;
  currentPage: Page | null;
  breadcrumb: BreadcrumbItem[];
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  
  // 视图状态
  viewMode: ViewMode;
  sidebarWidth: number;
  batchModeActive: boolean;
  
  // 搜索与筛选
  searchQuery: string;
  searchResults: Page[];
  
  // 编辑状态
  isEditing: boolean;
  editingId: string | null;
  editingContent: string;
  editingTitle: string;
  
  // 加载状态
  isLoading: boolean;
  isSaving: boolean;
  
  // 保存状态
  lastSavedAt: number | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  
  // 知识库操作
  loadKnowledgeBases: () => Promise<void>;
  createKnowledgeBase: (name: string, icon?: string, description?: string) => Promise<string>;
  updateKnowledgeBase: (id: string, name?: string, icon?: string, description?: string) => Promise<void>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  setCurrentKnowledgeBase: (knowledgeBase: KnowledgeBase | null) => void;
  
  // 页面操作
  loads: (knowledgeBaseId?: string, parentId?: string) => Promise<void>;
  create: (title: string, parentId?: string) => Promise<string>;
  createRoot: (title: string) => Promise<string>;
  update: (id: string, title?: string, parentId?: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
  move: (pageId: string, newParentId?: string, newOrderIndex?: number) => Promise<void>;
  
  // 页面管理
  setCurrent: (pageId: string | null) => Promise<void>;
  toggleExpansion: (pageId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toggleSelection: (pageId: string) => void;
  clearSelection: () => void;
  
  // 批量操作
  toggleBatchMode: () => void;
  batchDeletes: (pageIds: string[]) => Promise<void>;
  batchMoves: (pageIds: string[], targetParentId?: string) => Promise<void>;
  
  // 编辑操作
  startEditing: (pageId: string) => Promise<void>;
  saveCurrent: () => Promise<void>;
  cancelEditing: () => void;
  updateEditingContent: (content: string) => void;
  updateEditingTitle: (title: string) => void;
  
  // 块操作
  loadBlocks: (pageId: string, parentId?: string) => Promise<void>;
  createBlock: (pageId: string, blockType: string, content: string, parentId?: string) => Promise<string>;
  updateBlock: (id: string, content?: string, parentId?: string) => Promise<void>;
  updateBlocks: (pageId: string, blocks: any[]) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  moveBlock: (blockId: string, newParentId?: string, newOrderIndex?: number) => Promise<void>;
  
  // 搜索操作
  searchs: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // 视图操作
  setViewMode: (mode: ViewMode) => void;
  setSidebarWidth: (width: number) => void;
  
  // 工具方法
  buildTree: (pages: Page[]) => TreeNode[];
  findInTree: (tree: TreeNode[], pageId: string) => TreeNode | null;
  updateBreadcrumb: (pageId: string) => Promise<void>;
  
  // 保存状态管理
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setLastSavedAt: (timestamp: number) => void;
  toggleAutoSave: () => void;
  
  // 刷新
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useKnowledgeStore = create<KnowledgeStore>()(
  (set, get) => ({
  // 初始状态
  knowledgeBases: [],
  currentKnowledgeBase: null,
  pages: [],
  pageTree: [],
  blocks: [],
  
  currentId: null,
  currentPage: null,
  breadcrumb: [],
  expandedIds: new Set(),
  selectedIds: new Set(),
  
  viewMode: 'tree',
  sidebarWidth: 240,
  batchModeActive: false,
  
  searchQuery: '',
  searchResults: [],
  
  isEditing: false,
  editingId: null,
  editingContent: '',
  editingTitle: '',
  
  isLoading: false,
  isSaving: false,
  
  lastSavedAt: null,
  hasUnsavedChanges: false,
  autoSaveEnabled: true,

  // ===== 知识库操�?=====
  
  loadKnowledgeBases: async () => {
    try {
      set({ isLoading: true });
      
      // 确保数据库已初始化
      await DatabaseInitializer.ensureInitialized();
      
      const knowledgeBases = await DatabaseAPI.getKnowledgeBases();
      set({ knowledgeBases, isLoading: false });
      
      // 自动选择第一个知识库（如果有且当前没有选择）
      const { currentKnowledgeBase } = get();
      if (!currentKnowledgeBase && knowledgeBases.length > 0) {
        get().setCurrentKnowledgeBase(knowledgeBases[0]);
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      set({ knowledgeBases: [], isLoading: false });
      throw error;
    }
  },

  createKnowledgeBase: async (name: string, icon?: string, description?: string) => {
    try {
      const id = await DatabaseAPI.createKnowledgeBase(name, icon, description);
      await get().loadKnowledgeBases();
      return id;
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      throw error;
    }
  },

  updateKnowledgeBase: async (id: string, name?: string, icon?: string, description?: string) => {
    try {
      await DatabaseAPI.updateKnowledgeBase(id, name, icon, description);
      await get().loadKnowledgeBases();
    } catch (error) {
      console.error('Failed to update knowledge base:', error);
      throw error;
    }
  },

  deleteKnowledgeBase: async (id: string) => {
    try {
      await DatabaseAPI.deleteKnowledgeBase(id);
      await get().loadKnowledgeBases();
      
      // 如果删除的是当前知识库，清空当前状态
      const { currentKnowledgeBase } = get();
      if (currentKnowledgeBase && currentKnowledgeBase.id === id) {
        get().reset();
      }
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      throw error;
    }
  },

  setCurrentKnowledgeBase: (knowledgeBase: KnowledgeBase | null) => {
    set({ 
      currentKnowledgeBase: knowledgeBase,
      currentPage: null,
      currentId: null,
      pages: [],
      pageTree: [],
      blocks: [],
      breadcrumb: [],
      expandedIds: new Set(),
      selectedIds: new Set(),
      isEditing: false,
      editingId: null,
      editingContent: '',
      editingTitle: '',
      // 重置保存状态
      hasUnsavedChanges: false,
      lastSavedAt: null
    });
    
    if (knowledgeBase) {
      get().loads(knowledgeBase.id);
    }
  },

  // ===== 页面操作 =====

  loads: async (knowledgeBaseId?: string, _parentId?: string) => {
    try {
      const { currentKnowledgeBase } = get();
      const kbId = knowledgeBaseId || currentKnowledgeBase?.id;
      
      if (!kbId) {
        return;
      }

      // 确保数据库已初始化
      await DatabaseInitializer.ensureInitialized();

      // 只在没有数据时显示加载状态，避免频繁闪烁
      const { pages } = get();
      if (pages.length === 0) {
        set({ isLoading: true });
      }
      
      // For tree building, we need all pages in the knowledge base,
      const news = await DatabaseAPI.getAllPages(kbId);
      const pageTree = get().buildTree(news);
      
      // 默认展开所有一级页面
      const expandedIds = new Set<string>();
      pageTree.forEach(rootNode => {
        if (rootNode.hasChildren && rootNode.children.length > 0) {
          expandedIds.add(rootNode.id);
        }
      });
      
      set({ 
        pages: news, 
        pageTree,
        expandedIds: expandedIds,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load pages:', error);
      set({ pages: [], pageTree: [], isLoading: false });
      throw error;
    }
  },

  create: async (title: string, parentId?: string) => {
    try {
      const { currentKnowledgeBase } = get();
      if (!currentKnowledgeBase) {
        throw new Error('No active knowledge base');
      }

      const id = await DatabaseAPI.createPage(currentKnowledgeBase.id, title, parentId);
      await get().loads(currentKnowledgeBase.id);
      
      // 自动展开父页面
      if (parentId) {
        const { expandedIds } = get();
        set({ expandedIds: new Set(expandedIds).add(parentId) });
      }

      return id;
    } catch (error) {
      console.error('Failed to create page:', error);
      throw error;
    }
  },

  createRoot: async (title: string) => {
    return get().create(title);
  },

  update: async (id: string, title?: string, parentId?: string) => {
    try {
      await DatabaseAPI.updatePage(id, title, parentId);
      await get().refresh();
    } catch (error) {
      console.error('Failed to update page:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await DatabaseAPI.deletePage(id);
      await get().refresh();
      
      // 如果删除的是当前页面，清空当前状态
      const { currentId } = get();
      if (currentId === id) {
        set({ 
          currentId: null, 
          currentPage: null, 
          blocks: [],
          breadcrumb: [],
          isEditing: false,
          editingId: null,
          editingContent: '',
          editingTitle: ''
        });
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      throw error;
    }
  },

  move: async (pageId: string, newParentId?: string, newOrderIndex?: number) => {
    try {
      await DatabaseAPI.movePage(pageId, newParentId, newOrderIndex || 0);
      await get().refresh();
    } catch (error) {
      console.error('Failed to move page:', error);
      throw error;
    }
  },

  // ===== 页面管理 =====

  setCurrent: async (pageId: string | null) => {
    if (!pageId) {
      set({ 
        currentId: null, 
        currentPage: null, 
        blocks: [],
        breadcrumb: [],
        isEditing: false,
        editingId: null,
        editingContent: '',
        editingTitle: ''
      });
      return;
    }

    try {
      const page = await DatabaseAPI.getPageById(pageId);
      if (page) {
        set({ 
          currentId: pageId, 
          currentPage: page 
        });
        await get().updateBreadcrumb(pageId);
        await get().loadBlocks(pageId);
      } else {
        set({ 
          currentId: null, 
          currentPage: null, 
          blocks: [],
          breadcrumb: []
        });
      }
    } catch (error) {
      console.error('Failed to set current page:', error);
      set({ 
        currentId: null, 
        currentPage: null, 
        blocks: [],
        breadcrumb: []
      });
    }
  },

  toggleExpansion: (pageId: string) => {
    const { expandedIds } = get();
    const newExpandedIds = new Set(expandedIds);
    
    if (newExpandedIds.has(pageId)) {
      newExpandedIds.delete(pageId);
    } else {
      newExpandedIds.add(pageId);
    }

    set({ expandedIds: newExpandedIds });
  },

  expandAll: () => {
    const { pageTree } = get();
    const expandedIds = new Set<string>();
    
    // 递归收集所有有子页面的页面ID
    const collectExpandableIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.hasChildren && node.children.length > 0) {
          expandedIds.add(node.id);
          collectExpandableIds(node.children);
        }
      });
    };
    
    collectExpandableIds(pageTree);
    set({ expandedIds: expandedIds });
  },

  collapseAll: () => {
    set({ expandedIds: new Set() });
  },

  toggleSelection: (pageId: string) => {
    const { selectedIds } = get();
    const newSelectedIds = new Set(selectedIds);
    
    if (newSelectedIds.has(pageId)) {
      newSelectedIds.delete(pageId);
    } else {
      newSelectedIds.add(pageId);
    }

    set({ selectedIds: newSelectedIds });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  // ===== 批量操作 =====

  toggleBatchMode: () => {
    const { batchModeActive } = get();
    set({ 
      batchModeActive: !batchModeActive,
      selectedIds: new Set()
    });
  },

  batchDeletes: async (pageIds: string[]) => {
    try {
      for (const pageId of pageIds) {
        await DatabaseAPI.deletePage(pageId);
      }
      await get().refresh();
      set({ selectedIds: new Set() });
    } catch (error) {
      console.error('Failed to batch delete pages:', error);
      throw error;
    }
  },

  batchMoves: async (pageIds: string[], targetParentId?: string) => {
    try {
      for (const pageId of pageIds) {
        await DatabaseAPI.movePage(pageId, targetParentId, 0);
      }
      await get().refresh();
      set({ selectedIds: new Set() });
    } catch (error) {
      console.error('Failed to batch move pages:', error);
      throw error;
    }
  },

  // ===== 编辑操作 =====

  startEditing: async (pageId: string) => {
    try {
      const page = await DatabaseAPI.getPageById(pageId);
      if (page) {
        // Load page blocks to get content
        const blocks = await DatabaseAPI.getBlocks(pageId);
        const content = blocks.map(block => block.content).join('\n\n');
        
        set({
          isEditing: true,
          editingId: pageId,
          editingTitle: page.title,
          editingContent: content,
          currentId: pageId,
          currentPage: page,
          blocks: blocks
        });
        
        await get().updateBreadcrumb(pageId);
      }
    } catch (error) {
      console.error('Failed to start editing:', error);
      throw error;
    }
  },

  saveCurrent: async () => {
    const { editingId, editingTitle, editingContent } = get();
    if (!editingId) return;

    try {
      set({ isSaving: true });
      
      // Update page title
      await DatabaseAPI.updatePage(editingId, editingTitle);
      
      // Delete existing blocks and create new ones from content
      const existingBlocks = await DatabaseAPI.getBlocks(editingId);
      for (const block of existingBlocks) {
        await DatabaseAPI.deleteBlock(block.id);
      }
      
      // Create new blocks from content
      if (editingContent.trim()) {
        await DatabaseAPI.createBlock(editingId, 'paragraph', editingContent);
      }
      
      // Refresh data
      await get().loadBlocks(editingId);
      const updatedPage = await DatabaseAPI.getPageById(editingId);
      
      set({ 
        currentPage: updatedPage,
        isSaving: false 
      });
      
    } catch (error) {
      console.error('Failed to save page:', error);
      set({ isSaving: false });
      throw error;
    }
  },

  cancelEditing: () => {
    set({
      isEditing: false,
      editingId: null,
      editingContent: '',
      editingTitle: ''
    });
  },

  updateEditingContent: (content: string) => {
    set({ editingContent: content });
  },

  updateEditingTitle: (title: string) => {
    set({ editingTitle: title });
  },

  // ===== 块操作 =====

  loadBlocks: async (pageId: string, parentId?: string) => {
    try {
      // 确保数据库已初始化
      await DatabaseInitializer.ensureInitialized();
      
      // 块内容加载通常很快，不需要显示加载状态避免闪烁
      const blocks = await DatabaseAPI.getBlocks(pageId, parentId);
      set({ blocks });
    } catch (error) {
      console.error('Failed to load blocks:', error);
      set({ blocks: [] });
      throw error;
    }
  },

  createBlock: async (pageId: string, blockType: string, content: string, parentId?: string) => {
    try {
      const id = await DatabaseAPI.createBlock(pageId, blockType, content, parentId);
      await get().loadBlocks(pageId);
      return id;
    } catch (error) {
      console.error('Failed to create block:', error);
      throw error;
    }
  },

  updateBlock: async (id: string, content?: string, parentId?: string) => {
    try {
      await DatabaseAPI.updateBlock(id, content, parentId);
      const { currentId } = get();
      if (currentId) {
        await get().loadBlocks(currentId);
      }
    } catch (error) {
      console.error('Failed to update block:', error);
      throw error;
    }
  },

  deleteBlock: async (id: string) => {
    try {
      await DatabaseAPI.deleteBlock(id);
      const { currentId } = get();
      if (currentId) {
        await get().loadBlocks(currentId);
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
      throw error;
    }
  },

  moveBlock: async (blockId: string, newParentId?: string, newOrderIndex?: number) => {
    try {
      await DatabaseAPI.moveBlock(blockId, newParentId, newOrderIndex || 0);
      const { currentId } = get();
      if (currentId) {
        await get().loadBlocks(currentId);
      }
    } catch (error) {
      console.error('Failed to move block:', error);
      throw error;
    }
  },

  updateBlocks: async (pageId: string, blocks: any[]) => {
    try {
      // 这是一个批量更新页面块内容的方法
      // 目前的实现是创建一个简单的文本块
      if (blocks.length > 0 && blocks[0].content) {
        // 清除现有块
        const existingBlocks = await DatabaseAPI.getBlocks(pageId);
        for (const block of existingBlocks) {
          await DatabaseAPI.deleteBlock(block.id);
        }
        
        // 创建新的块
        await DatabaseAPI.createBlock(pageId, 'paragraph', blocks[0].content);
        
        // 刷新块数据
        await get().loadBlocks(pageId);
      }
    } catch (error) {
      console.error('Failed to update blocks:', error);
      throw error;
    }
  },

  // ===== 搜索操作 =====

  searchs: async (query: string) => {
    set({ searchQuery: query });
    
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      const { currentKnowledgeBase } = get();
      if (!currentKnowledgeBase) return;
      
      set({ isLoading: true });
      const searchResults = await DatabaseAPI.searchPages(currentKnowledgeBase.id, query);
      set({ searchResults, isLoading: false });
    } catch (error) {
      console.error('Failed to search pages:', error);
      set({ searchResults: [], isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] });
  },

  // ===== 视图操作 =====

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: width });
  },

  // ===== 工具方法 =====

  buildTree: (pages: Page[]): TreeNode[] => {
    if (pages.length === 0) return [];
    
    const pageMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];
    const { expandedIds } = get();

    // Create node mapping
    pages.forEach(page => {
      pageMap.set(page.id, {
        ...page,
        children: [],
        hasChildren: false,
        isExpanded: expandedIds.has(page.id)
      });
    });

    // Build tree structure
    pages.forEach(page => {
      const node = pageMap.get(page.id);
      if (!node) return;

      if (page.parent_id) {
        const parent = pageMap.get(page.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Update hasChildren based on actual children count
    for (const node of pageMap.values()) {
      node.hasChildren = node.children.length > 0;
    }

    // Sort by sort_order
    const sortByOrder = (a: TreeNode, b: TreeNode) => {
      return a.sort_order - b.sort_order;
    };

    rootNodes.sort(sortByOrder);
    for (const node of pageMap.values()) {
      if (node.children.length > 1) {
        node.children.sort(sortByOrder);
      }
    }

    return rootNodes;
  },

  findInTree: (tree: TreeNode[], pageId: string): TreeNode | null => {
    for (const node of tree) {
      if (node.id === pageId) {
        return node;
      }
      const found = get().findInTree(node.children, pageId);
      if (found) {
        return found;
      }
    }
    return null;
  },

  updateBreadcrumb: async (pageId: string) => {
    try {
      const breadcrumbs = await DatabaseAPI.getPageBreadcrumb(pageId);
      const breadcrumb: BreadcrumbItem[] = breadcrumbs.map((page: Page) => ({
        id: page.id,
        title: page.title
      }));
      set({ breadcrumb });
    } catch (error) {
      console.error('Failed to update breadcrumb:', error);
      set({ breadcrumb: [] });
    }
  },

  // ===== 刷新和重置 =====

  refresh: async () => {
    const { currentKnowledgeBase } = get();
    if (currentKnowledgeBase) {
      await get().loads(currentKnowledgeBase.id);
    }
  },

  reset: () => {
    set({
      currentKnowledgeBase: null,
      pages: [],
      pageTree: [],
      blocks: [],
      currentId: null,
      currentPage: null,
      breadcrumb: [],
      expandedIds: new Set(),
      selectedIds: new Set(),
      batchModeActive: false,
      searchQuery: '',
      searchResults: [],
      isEditing: false,
      editingId: null,
      editingContent: '',
      editingTitle: '',
      isLoading: false,
      isSaving: false,
      lastSavedAt: null,
      hasUnsavedChanges: false
    });
  },

  // ===== 保存状态管理 =====

  setHasUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges });
  },

  setLastSavedAt: (timestamp: number) => {
    set({ 
      lastSavedAt: timestamp,
      hasUnsavedChanges: false
    });
  },

  toggleAutoSave: () => {
    const { autoSaveEnabled } = get();
    set({ autoSaveEnabled: !autoSaveEnabled });
  }
  })
);




