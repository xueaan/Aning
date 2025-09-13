import { create } from 'zustand';
import { DatabaseAPI } from '@/services/api/database';
import type { KnowledgeBase } from '@/types';

interface KnowledgeBaseState {
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: KnowledgeBase | null;
  isLoading: boolean;
}

interface KnowledgeBaseActions {
  loadKnowledgeBases: () => Promise<void>;
  createKnowledgeBase: (name: string, icon?: string, description?: string) => Promise<string>;
  updateKnowledgeBase: (id: string, name?: string, icon?: string, description?: string) => Promise<void>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  setCurrentKnowledgeBase: (knowledgeBase: KnowledgeBase | null) => void;
}

export interface KnowledgeBaseStore extends KnowledgeBaseState, KnowledgeBaseActions {}

export const useKnowledgeBaseStore = create<KnowledgeBaseStore>((set) => ({
  // State
  knowledgeBases: [],
  currentKnowledgeBase: null,
  isLoading: false,

  // Actions
  loadKnowledgeBases: async () => {
    set({ isLoading: true });
    try {
      const knowledgeBases = await DatabaseAPI.getAllKnowledgeBases();
      set({ knowledgeBases, isLoading: false });
    } catch (error) {
      console.error('加载知识库失败:', error);
      set({ isLoading: false });
    }
  },

  createKnowledgeBase: async (name: string, icon?: string, description?: string) => {
    try {
      const id = await DatabaseAPI.createKnowledgeBase(name, icon, description);
      const newKB: KnowledgeBase = {
        id,
        name,
        icon,
        description,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      set(state => ({
        knowledgeBases: [...state.knowledgeBases, newKB]
      }));
      
      return id;
    } catch (error) {
      console.error('创建知识库失败:', error);
      throw error;
    }
  },

  updateKnowledgeBase: async (id: string, name?: string, icon?: string, description?: string) => {
    try {
      await DatabaseAPI.updateKnowledgeBase(id, name, icon, description);
      
      set(state => ({
        knowledgeBases: state.knowledgeBases.map(kb =>
          kb.id === id
            ? { ...kb, name: name || kb.name, icon: icon || kb.icon, description: description || kb.description, updated_at: Date.now() }
            : kb
        ),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === id
          ? { ...state.currentKnowledgeBase, name: name || state.currentKnowledgeBase.name, icon: icon || state.currentKnowledgeBase.icon, description: description || state.currentKnowledgeBase.description }
          : state.currentKnowledgeBase
      }));
    } catch (error) {
      console.error('更新知识库失败:', error);
      throw error;
    }
  },

  deleteKnowledgeBase: async (id: string) => {
    try {
      await DatabaseAPI.deleteKnowledgeBase(id);
      
      set(state => ({
        knowledgeBases: state.knowledgeBases.filter(kb => kb.id !== id),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === id ? null : state.currentKnowledgeBase
      }));
    } catch (error) {
      console.error('删除知识库失败:', error);
      throw error;
    }
  },

  setCurrentKnowledgeBase: (knowledgeBase: KnowledgeBase | null) => {
    set({ currentKnowledgeBase: knowledgeBase });
  }
}));