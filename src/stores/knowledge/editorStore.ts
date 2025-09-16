import { create } from 'zustand';
import { DatabaseAPI } from '@/services/api/database';
import type { Block } from '@/types';

interface EditorState {
  // 编辑状态
  isEditing: boolean;
  editingPageId: string | null;
  editingContent: string;
  editingTitle: string;

  // 保存状态
  isSaving: boolean;
  lastSavedAt: number | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;

  // 块数据
  blocks: Block[];
  selectedBlocks: Set<string>;

  // 版本控制
  history: Array<{ content: string; timestamp: number }>;
  historyIndex: number;
}

interface EditorActions {
  // 编辑控制
  startEditing: (pageId: string) => Promise<void>;
  saveContent: () => Promise<void>;
  cancelEditing: () => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;

  // 自动保存
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;

  // 块操作
  loadBlocks: (pageId: string) => Promise<void>;
  createBlock: (
    pageId: string,
    blockType: string,
    content: string,
    parentId?: string
  ) => Promise<string>;
  updateBlock: (blockId: string, content: string) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  moveBlock: (blockId: string, newParentId?: string, newIndex?: number) => Promise<void>;

  // 选择操作
  selectBlock: (blockId: string) => void;
  selectMultipleBlocks: (blockIds: string[]) => void;
  clearBlockSelection: () => void;

  // 版本控制
  pushToHistory: (content: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export interface EditorStore extends EditorState, EditorActions {}

export const useEditorStore = create<EditorStore>((set, get) => {
  let autoSaveTimer: NodeJS.Timeout | null = null;

  return {
    // State
    isEditing: false,
    editingPageId: null,
    editingContent: '',
    editingTitle: '',
    isSaving: false,
    lastSavedAt: null,
    hasUnsavedChanges: false,
    autoSaveEnabled: true,
    blocks: [],
    selectedBlocks: new Set(),
    history: [],
    historyIndex: -1,

    // Actions
    startEditing: async (pageId: string) => {
      try {
        const pageData = await DatabaseAPI.getPageContent(pageId);

        set({
          isEditing: true,
          editingPageId: pageId,
          editingContent: pageData.content || '',
          editingTitle: pageData.title || '',
          hasUnsavedChanges: false,
          history: [{ content: pageData.content || '', timestamp: Date.now() }],
          historyIndex: 0,
        });

        // 加载页面的块
        await get().loadBlocks(pageId);
      } catch (error) {
        console.error('开始编辑失败:', error);
        throw error;
      }
    },

    saveContent: async () => {
      const { editingPageId, editingContent, editingTitle } = get();
      if (!editingPageId) return;

      set({ isSaving: true });

      try {
        await DatabaseAPI.updatePageContent(editingPageId, editingContent, editingTitle);

        set({
          isSaving: false,
          hasUnsavedChanges: false,
          lastSavedAt: Date.now(),
        });
      } catch (error) {
        console.error('保存失败:', error);
        set({ isSaving: false });
        throw error;
      }
    },

    cancelEditing: () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }

      set({
        isEditing: false,
        editingPageId: null,
        editingContent: '',
        editingTitle: '',
        hasUnsavedChanges: false,
        blocks: [],
        selectedBlocks: new Set(),
        history: [],
        historyIndex: -1,
      });
    },

    updateContent: (content: string) => {
      set((state) => {
        // 推送到历史记录
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ content, timestamp: Date.now() });

        return {
          editingContent: content,
          hasUnsavedChanges: true,
          history: newHistory.slice(-50), // 保留最近50个版本
          historyIndex: Math.min(newHistory.length - 1, 49),
        };
      });

      // 触发自动保存
      if (get().autoSaveEnabled) {
        get().triggerAutoSave();
      }
    },

    updateTitle: (title: string) => {
      set({
        editingTitle: title,
        hasUnsavedChanges: true,
      });
    },

    enableAutoSave: () => {
      set({ autoSaveEnabled: true });
    },

    disableAutoSave: () => {
      set({ autoSaveEnabled: false });
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
    },

    triggerAutoSave: async () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      autoSaveTimer = setTimeout(async () => {
        if (get().hasUnsavedChanges) {
          await get().saveContent();
        }
      }, 2000); // 2秒后自动保存
    },

    // 块操作
    loadBlocks: async (pageId: string) => {
      try {
        const blocks = await DatabaseAPI.getBlocks(pageId);
        set({ blocks });
      } catch (error) {
        console.error('加载块失败:', error);
      }
    },

    createBlock: async (pageId: string, blockType: string, content: string, parentId?: string) => {
      try {
        const blockId = await DatabaseAPI.createBlock(pageId, blockType, content, parentId);
        await get().loadBlocks(pageId); // 重新加载块
        return blockId;
      } catch (error) {
        console.error('创建块失败:', error);
        throw error;
      }
    },

    updateBlock: async (blockId: string, content: string) => {
      try {
        await DatabaseAPI.updateBlock(blockId, content);

        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === blockId ? { ...block, content, updated_at: Date.now() } : block
          ),
        }));
      } catch (error) {
        console.error('更新块失败:', error);
        throw error;
      }
    },

    deleteBlock: async (blockId: string) => {
      try {
        await DatabaseAPI.deleteBlock(blockId);

        set((state) => ({
          blocks: state.blocks.filter((block) => block.id !== blockId),
          selectedBlocks: new Set([...state.selectedBlocks].filter((id) => id !== blockId)),
        }));
      } catch (error) {
        console.error('删除块失败:', error);
        throw error;
      }
    },

    moveBlock: async (blockId: string, newParentId?: string, newIndex?: number) => {
      try {
        await DatabaseAPI.moveBlock(blockId, newParentId, newIndex);
        const { editingPageId } = get();
        if (editingPageId) {
          await get().loadBlocks(editingPageId);
        }
      } catch (error) {
        console.error('移动块失败:', error);
        throw error;
      }
    },

    selectBlock: (blockId: string) => {
      set({
        selectedBlocks: new Set([blockId]),
      });
    },

    selectMultipleBlocks: (blockIds: string[]) => {
      set({
        selectedBlocks: new Set(blockIds),
      });
    },

    clearBlockSelection: () => {
      set({
        selectedBlocks: new Set(),
      });
    },

    pushToHistory: (content: string) => {
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ content, timestamp: Date.now() });

        return {
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        };
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        set({
          editingContent: history[newIndex].content,
          historyIndex: newIndex,
          hasUnsavedChanges: true,
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        set({
          editingContent: history[newIndex].content,
          historyIndex: newIndex,
          hasUnsavedChanges: true,
        });
      }
    },

    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },

    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },
  };
});
