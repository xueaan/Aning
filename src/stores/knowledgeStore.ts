// 重构后的 knowledgeStore - 作为其他 store 的协调器
import { create } from 'zustand';
import { useKnowledgeBaseStore } from './knowledge/knowledgeBaseStore';
import { usePageStore } from './knowledge/pageStore';
import { useSearchStore } from './knowledge/searchStore';
import { useEditorStore } from './knowledge/editorStore';

// 视图模式类型
export type ViewMode = 'list' | 'card' | 'board' | 'tree';

interface KnowledgeState {
  // 视图状态
  viewMode: ViewMode;
  sidebarWidth: number;
  batchModeActive: boolean;

  // 模态框状态
  showCreateModal: boolean;
  showEditModal: boolean;
  editingKnowledgeBase: any;
}

interface KnowledgeActions {
  // 视图控制
  setViewMode: (mode: ViewMode) => void;
  setSidebarWidth: (width: number) => void;

  // 批量操作
  toggleBatchMode: () => void;
  batchDeletePages: (pageIds: string[]) => Promise<void>;
  batchMovePages: (pageIds: string[], targetParentId?: string) => Promise<void>;

  // 模态框控制
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (knowledgeBase: any) => void;
  closeEditModal: () => void;

  // 集成操作 - 协调多个子 store
  initializeKnowledge: (knowledgeBaseId?: string) => Promise<void>;
  switchKnowledgeBase: (knowledgeBaseId: string) => Promise<void>;
}

export interface KnowledgeStore extends KnowledgeState, KnowledgeActions {}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  // State
  viewMode: 'tree',
  sidebarWidth: 300,
  batchModeActive: false,
  showCreateModal: false,
  showEditModal: false,
  editingKnowledgeBase: null,

  // Actions
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: width });
  },

  toggleBatchMode: () => {
    set((state) => ({ batchModeActive: !state.batchModeActive }));

    // 批量模式关闭时清除选择
    if (!get().batchModeActive) {
      const pageStore = usePageStore.getState();
      pageStore.clearSelection();
    }
  },

  batchDeletePages: async (pageIds: string[]) => {
    const pageStore = usePageStore.getState();

    try {
      // 批量删除页面
      await Promise.all(pageIds.map((id) => pageStore.deletePage(id)));

      // 清除选择并关闭批量模式
      pageStore.clearSelection();
      set({ batchModeActive: false });
    } catch (error) {
      console.error('批量删除页面失败:', error);
      throw error;
    }
  },

  batchMovePages: async (pageIds: string[], targetParentId?: string) => {
    const pageStore = usePageStore.getState();

    try {
      // 批量移动页面
      await Promise.all(pageIds.map((id) => pageStore.movePage(id, targetParentId)));

      // 清除选择并关闭批量模式
      pageStore.clearSelection();
      set({ batchModeActive: false });
    } catch (error) {
      console.error('批量移动页面失败:', error);
      throw error;
    }
  },

  openCreateModal: () => {
    set({ showCreateModal: true });
  },

  closeCreateModal: () => {
    set({ showCreateModal: false });
  },

  openEditModal: (knowledgeBase: any) => {
    set({ showEditModal: true, editingKnowledgeBase: knowledgeBase });
  },

  closeEditModal: () => {
    set({ showEditModal: false, editingKnowledgeBase: null });
  },

  // 集成操作
  initializeKnowledge: async (knowledgeBaseId?: string) => {
    const kbStore = useKnowledgeBaseStore.getState();

    try {
      // 加载知识库列表
      await kbStore.loadKnowledgeBases();

      // 智能默认选择逻辑
      if (knowledgeBaseId) {
        // 1. 优先使用指定的知识库ID
        const kb = kbStore.knowledgeBases.find((kb) => kb.id === knowledgeBaseId);
        if (kb) {
          await get().switchKnowledgeBase(knowledgeBaseId);
        }
      } else if (kbStore.knowledgeBases.length > 0) {
        // 2. 尝试使用上次使用的知识库
        const { useAppStore } = await import('@/stores');
        const appStore = useAppStore.getState();
        const lastUsedId = appStore.lastUsedKnowledgeBaseId;

        let targetKb = null;
        if (lastUsedId) {
          targetKb = kbStore.knowledgeBases.find((kb) => kb.id === lastUsedId);
        }

        // 3. 如果上次使用的知识库不存在，选择第一个可用的
        if (!targetKb) {
          targetKb = kbStore.knowledgeBases[0];
        }

        if (targetKb) {
          await get().switchKnowledgeBase(targetKb.id);
        }
      }
    } catch (error) {
      console.error('初始化知识库失败:', error);
    }
  },

  switchKnowledgeBase: async (knowledgeBaseId: string) => {
    const kbStore = useKnowledgeBaseStore.getState();
    const pageStore = usePageStore.getState();

    try {
      // 设置当前知识库
      const kb = kbStore.knowledgeBases.find((kb) => kb.id === knowledgeBaseId);
      if (kb) {
        kbStore.setCurrentKnowledgeBase(kb);

        // 记录用户选择行为 - 更新最后使用的知识库
        const { useAppStore } = await import('@/stores');
        const appStore = useAppStore.getState();
        appStore.setLastUsedKnowledgeBaseId(knowledgeBaseId);

        // 加载页面
        await pageStore.loadPages(knowledgeBaseId);

        // 清除之前的编辑状态
        const editorStore = useEditorStore.getState();
        if (editorStore.isEditing) {
          editorStore.cancelEditing();
        }

        // 清除搜索状态
        const searchStore = useSearchStore.getState();
        searchStore.clearSearch();
        searchStore.setSearchFilters({ knowledgeBaseId });
      }
    } catch (error) {
      console.error('切换知识库失败:', error);
      throw error;
    }
  },
}));

// 导出组合 Hook，提供统一的知识库操作接口
export const useKnowledgeOperations = () => {
  const mainStore = useKnowledgeStore();
  const kbStore = useKnowledgeBaseStore();
  const pageStore = usePageStore();
  const searchStore = useSearchStore();
  const editorStore = useEditorStore();

  return {
    // 主 store
    ...mainStore,

    // 知识库操作
    ...kbStore,

    // 页面操作
    ...pageStore,

    // 搜索操作
    ...searchStore,

    // 编辑操作
    ...editorStore,
  };
};
