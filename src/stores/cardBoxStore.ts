import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

// 数据类型定义
export interface CardBox {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  cards_count: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface Card {
  id: string;
  box_id: string;
  title: string;
  content?: string;
  preview?: string;
  color?: string;
  tags?: string[];
  is_pinned: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

// 更新用的数据结构
export interface CardBoxUpdate {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export interface CardUpdate {
  title?: string;
  content?: string;
  preview?: string;
  color?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
  sort_order?: number;
}

// Store 接口定义
interface CardBoxStore {
  // 状态
  boxes: CardBox[];
  activeBoxId: string | null;
  cards: Card[];
  selectedCard: Card | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // 编辑器相关状态
  editorModalOpen: boolean;
  editingCard: Card | null;
  
  // 全屏编辑器相关状态
  fullEditorOpen: boolean;
  fullEditingCard: Card | null;
  
  // 展开视图相关状态
  expandedViewOpen: boolean;
  expandedCard: Card | null;
  
  // 笔记盒操作
  loadBoxes: () => Promise<void>;
  createBox: (name: string, description?: string, color?: string, icon?: string) => Promise<CardBox>;
  updateBox: (id: string, updates: CardBoxUpdate) => Promise<void>;
  deleteBox: (id: string) => Promise<void>;
  selectBox: (id: string | null) => Promise<void>;
  
  // 笔记操作
  loadCards: (boxId?: string) => Promise<void>;
  createCard: (boxId: string, title: string, content: string) => Promise<Card>;
  updateCard: (id: string, updates: CardUpdate) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, targetBoxId: string) => Promise<void>;
  
  // 编辑器操作
  openEditor: (card?: Card, boxId?: string) => void;
  closeEditor: () => void;
  saveCard: (title: string, content: string) => Promise<void>;
  
  // 全屏编辑器操作
  openFullEditor: (card?: Card, boxId?: string) => void;
  closeFullEditor: () => void;
  saveFullCard: (title: string, content: string, shouldClose?: boolean) => Promise<void>;
  
  // 展开视图操作
  openExpandedView: (card: Card) => void;
  closeExpandedView: () => void;
  saveExpandedCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  
  // 搜索和视图
  searchCards: (query: string) => Promise<void>;
  setSelectedCard: (card: Card | null) => void;
  
  // 工具方法
  clearError: () => void;
  refreshData: () => Promise<void>;
}

// 创建 Store
export const useCardBoxStore = create<CardBoxStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      boxes: [],
      activeBoxId: null,
      cards: [],
      selectedCard: null,
      searchQuery: '',
      isLoading: false,
      error: null,
      editorModalOpen: false,
      editingCard: null,
      fullEditorOpen: false,
      fullEditingCard: null,
      expandedViewOpen: false,
      expandedCard: null,

      // 笔记盒操作
      loadBoxes: async () => {
        try {
          set({ isLoading: true, error: null });
          const boxes = await invoke<CardBox[]>('get_card_boxes');
          set({ boxes, isLoading: false });
        } catch (error) {
          console.error('Failed to load boxes:', error);
          set({ 
            error: error instanceof Error ? error.message : '加载笔记盒失败',
            isLoading: false 
          });
        }
      },

      createBox: async (name: string, description?: string, color?: string, icon?: string) => {
        try {
          set({ isLoading: true, error: null });
          const newBox = await invoke<CardBox>('create_card_box', {
            name,
            description,
            color,
            icon
          });
          
          set((state) => ({
            boxes: [...state.boxes, newBox],
            isLoading: false
          }));
          
          return newBox;
        } catch (error) {
          console.error('Failed to create box:', error);
          set({ 
            error: error instanceof Error ? error.message : '创建笔记盒失败',
            isLoading: false 
          });
          throw error;
        }
      },

      updateBox: async (id: string, updates: CardBoxUpdate) => {
        try {
          set({ error: null });
          await invoke('update_card_box', { id, updates });
          
          set((state) => ({
            boxes: state.boxes.map((box) =>
              box.id === id
                ? { 
                    ...box, 
                    ...updates,
                    updated_at: Date.now()
                  }
                : box
            )
          }));
        } catch (error) {
          console.error('Failed to update box:', error);
          set({ error: error instanceof Error ? error.message : '更新笔记盒失败' });
          throw error;
        }
      },

      deleteBox: async (id: string) => {
        try {
          set({ error: null });
          await invoke('delete_card_box', { id });
          
          set((state) => ({
            boxes: state.boxes.filter((box) => box.id !== id),
            activeBoxId: state.activeBoxId === id ? null : state.activeBoxId,
            cards: state.activeBoxId === id ? [] : state.cards
          }));
        } catch (error) {
          console.error('Failed to delete box:', error);
          set({ error: error instanceof Error ? error.message : '删除笔记盒失败' });
          throw error;
        }
      },

      selectBox: async (id: string | null) => {
        try {
          set({ activeBoxId: id, isLoading: true, error: null });
          
          if (id) {
            const cards = await invoke<Card[]>('get_cards', { boxId: id });
            set({ cards, isLoading: false });
          } else {
            // 显示所有卡片
            const cards = await invoke<Card[]>('get_cards', { boxId: null });
            set({ cards, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load cards:', error);
          set({ 
            error: error instanceof Error ? error.message : '加载卡片失败',
            isLoading: false 
          });
        }
      },

      // 笔记操作
      loadCards: async (boxId?: string) => {
        try {
          set({ isLoading: true, error: null });
          const cards = await invoke<Card[]>('get_cards', { boxId: boxId });
          set({ cards, isLoading: false });
        } catch (error) {
          console.error('Failed to load cards:', error);
          set({ 
            error: error instanceof Error ? error.message : '加载卡片失败',
            isLoading: false 
          });
        }
      },

      createCard: async (boxId: string, title: string, content: string) => {
        try {
          set({ error: null });
          const newCard = await invoke<Card>('create_card', {
            boxId,
            title,
            content
          });
          
          set((state) => ({
            cards: [newCard, ...state.cards],
            boxes: state.boxes.map((box) =>
              box.id === boxId
                ? { ...box, cards_count: box.cards_count + 1 }
                : box
            )
          }));
          
          return newCard;
        } catch (error) {
          console.error('Failed to create card:', error);
          set({ error: error instanceof Error ? error.message : '创建卡片失败' });
          throw error;
        }
      },

      updateCard: async (id: string, updates: CardUpdate) => {
        try {
          set({ error: null });
          console.log('调用 updateCard Tauri 命令:', { id, updates });
          await invoke('update_card', { id, updates });
          
          console.log('updateCard 成功，更新本地状态');
          set((state) => ({
            cards: state.cards.map((card) =>
              card.id === id
                ? { 
                    ...card, 
                    ...updates,
                    updated_at: Date.now()
                  }
                : card
            )
          }));
          console.log('本地状态更新完成');
        } catch (error) {
          console.error('Failed to update card:', error);
          set({ error: error instanceof Error ? error.message : '更新卡片失败' });
          throw error;
        }
      },

      deleteCard: async (id: string) => {
        try {
          set({ error: null });
          const cardToDelete = get().cards.find(c => c.id === id);
          
          await invoke('delete_card', { id });
          
          set((state) => ({
            cards: state.cards.filter((card) => card.id !== id),
            selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
            boxes: cardToDelete ? state.boxes.map((box) =>
              box.id === cardToDelete.box_id
                ? { ...box, cards_count: Math.max(0, box.cards_count - 1) }
                : box
            ) : state.boxes
          }));
        } catch (error) {
          console.error('Failed to delete card:', error);
          set({ error: error instanceof Error ? error.message : '删除卡片失败' });
          throw error;
        }
      },

      moveCard: async (cardId: string, targetBoxId: string) => {
        try {
          set({ error: null });
          const card = get().cards.find(c => c.id === cardId);
          if (!card) return;
          
          const oldBoxId = card.box_id;
          
          await invoke('move_card', { cardId, targetBoxId });
          
          set((state) => ({
            cards: state.cards.map((c) =>
              c.id === cardId
                ? { ...c, box_id: targetBoxId, updated_at: Date.now() }
                : c
            ),
            boxes: state.boxes.map((box) => {
              if (box.id === oldBoxId) {
                return { ...box, cards_count: Math.max(0, box.cards_count - 1) };
              } else if (box.id === targetBoxId) {
                return { ...box, cards_count: box.cards_count + 1 };
              }
              return box;
            })
          }));
        } catch (error) {
          console.error('Failed to move card:', error);
          set({ error: error instanceof Error ? error.message : '移动卡片失败' });
          throw error;
        }
      },

      // 编辑器操作
      openEditor: (card?: Card, boxId?: string) => {
        set({
          editorModalOpen: true,
          editingCard: card || null,
          activeBoxId: boxId || get().activeBoxId
        });
      },

      closeEditor: () => {
        set({
          editorModalOpen: false,
          editingCard: null
        });
      },

      saveCard: async (title: string, content: string) => {
        try {
          const { editingCard, activeBoxId } = get();
          console.log('Store saveCard:', { editingCard: !!editingCard, activeBoxId, title, content });
          
          if (editingCard) {
            console.log('更新现有卡片:', editingCard.id);
            // 更新现有卡片
            await get().updateCard(editingCard.id, { 
              title, 
              content
            });
          } else if (activeBoxId) {
            console.log('创建新卡片到盒子:', activeBoxId);
            // 创建新卡片
            await get().createCard(activeBoxId, title, content);
          } else {
            throw new Error('无法保存卡片：缺少必要信息');
          }

          console.log('保存成功，关闭编辑器');
          get().closeEditor();
        } catch (error) {
          console.error('Failed to save card:', error);
          throw error;
        }
      },

      // 全屏编辑器操作
      openFullEditor: (card?: Card, boxId?: string) => {
        set({
          fullEditorOpen: true,
          fullEditingCard: card || null,
          activeBoxId: boxId || get().activeBoxId,
          isLoading: false, // 重置加载状态
        });
      },

      closeFullEditor: () => {
        set({
          fullEditorOpen: false,
          fullEditingCard: null
        });
      },

      saveFullCard: async (title: string, content: string, shouldClose = true) => {
        try {
          const { fullEditingCard, activeBoxId, boxes } = get();
          console.log('Store saveFullCard:', { fullEditingCard: !!fullEditingCard, activeBoxId, title, content, shouldClose });
          
          if (fullEditingCard) {
            console.log('更新现有卡片:', fullEditingCard.id);
            // 更新现有卡片
            await get().updateCard(fullEditingCard.id, { 
              title, 
              content
            });
          } else {
            // 创建新卡片时，确定目标盒子ID
            let targetBoxId = activeBoxId;
            
            if (!targetBoxId && boxes.length > 0) {
              // 如果没有活动盒子但有盒子存在，使用第一个盒子
              targetBoxId = boxes[0].id;
              console.log('使用默认盒子:', targetBoxId);
            }

            if (!targetBoxId) {
              // 如果完全没有盒子，创建一个默认盒子
              console.log('创建默认盒子');
              const defaultBox = await get().createBox('默认笔记盒', '系统自动创建的默认笔记盒');
              targetBoxId = defaultBox.id;
              // 更新activeBoxId
              set({ activeBoxId: targetBoxId });
            }

            console.log('创建新卡片到盒子:', targetBoxId);
            // 创建新卡片
            const newCard = await get().createCard(targetBoxId, title, content);
            
            // 创建成功后，设置为正在编辑的卡片
            if (!shouldClose) {
              set({ fullEditingCard: newCard });
            }
          }

          if (shouldClose) {
            console.log('保存成功，关闭全屏编辑器');
            get().closeFullEditor();
          } else {
            console.log('保存成功，保持编辑器打开');
          }
        } catch (error) {
          console.error('Failed to save full card:', error);
          throw error;
        }
      },

      // 搜索和视图
      searchCards: async (query: string) => {
        try {
          set({ searchQuery: query, isLoading: true, error: null });
          
          if (query.trim()) {
            const results = await invoke<Card[]>('search_cards', { query });
            set({ cards: results, isLoading: false });
          } else {
            // 重新加载当前卡片盒的卡片
            await get().selectBox(get().activeBoxId);
          }
        } catch (error) {
          console.error('Failed to search cards:', error);
          set({ 
            error: error instanceof Error ? error.message : '搜索失败',
            isLoading: false 
          });
        }
      },

      setSelectedCard: (card: Card | null) => {
        set({ selectedCard: card });
      },

      // 展开视图操作
      openExpandedView: (card: Card) => {
        set({
          expandedViewOpen: true,
          expandedCard: card
        });
      },

      closeExpandedView: () => {
        set({
          expandedViewOpen: false,
          expandedCard: null
        });
      },

      saveExpandedCard: async (cardId: string, updates: Partial<Card>) => {
        try {
          set({ error: null });
          
          // 构建更新参数
          const updateData: CardUpdate = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.content !== undefined) updateData.content = updates.content;
          if (updates.tags !== undefined) updateData.tags = updates.tags;
          if (updates.is_pinned !== undefined) updateData.is_pinned = updates.is_pinned;
          if (updates.is_archived !== undefined) updateData.is_archived = updates.is_archived;

          await invoke('update_card', { id: cardId, updates: updateData });
          
          // 更新本地状态
          set((state) => ({
            cards: state.cards.map(card => 
              card.id === cardId ? { ...card, ...updates } : card
            ),
            expandedCard: state.expandedCard ? { ...state.expandedCard, ...updates } : null
          }));
          
        } catch (error) {
          console.error('Failed to save expanded card:', error);
          set({ 
            error: error instanceof Error ? error.message : '保存卡片失败'
          });
          throw error;
        }
      },

      // 工具方法
      clearError: () => {
        set({ error: null });
      },

      refreshData: async () => {
        const { activeBoxId } = get();
        await Promise.all([get().loadBoxes(), get().selectBox(activeBoxId)]);
      }
    }),
    {
      name: 'cardbox-store'
    }
  )
);




