import { create } from 'zustand';
import { DatabaseAPI } from '@/services/api/database';
import type { Page, Block } from '@/types';

interface SearchResult {
  type: 'page' | 'block';
  id: string;
  title: string;
  content: string;
  highlight?: string;
  path?: string[];
  score?: number;
}

interface SearchState {
  searchQuery: string;
  searchResults: SearchResult[];
  recentSearches: string[];
  isSearching: boolean;
  searchFilters: {
    type?: 'page' | 'block' | 'all';
    knowledgeBaseId?: string;
    dateRange?: { start: Date; end: Date };
  };
}

interface SearchActions {
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  addToRecentSearches: (query: string) => void;
  clearRecentSearches: () => void;
  setSearchFilters: (filters: Partial<SearchState['searchFilters']>) => void;
  searchPages: (query: string, knowledgeBaseId?: string) => Promise<Page[]>;
  searchBlocks: (query: string, knowledgeBaseId?: string) => Promise<Block[]>;
  highlightText: (text: string, query: string) => string;
}

export interface SearchStore extends SearchState, SearchActions {}

export const useSearchStore = create<SearchStore>((set, get) => ({
  // State
  searchQuery: '',
  searchResults: [],
  recentSearches: JSON.parse(localStorage.getItem('knowledgeSearchRecent') || '[]'),
  isSearching: false,
  searchFilters: {
    type: 'all'
  },

  // Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
    }
  },

  performSearch: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true, searchQuery: query });
    
    try {
      const { searchFilters } = get();
      const results: SearchResult[] = [];

      // 搜索页面
      if (searchFilters.type === 'all' || searchFilters.type === 'page') {
        const pages = await get().searchPages(query, searchFilters.knowledgeBaseId);
        results.push(...pages.map(page => ({
          type: 'page' as const,
          id: page.id,
          title: page.title,
          content: page.title,
          highlight: page.title.toLowerCase().includes(query.toLowerCase()) ? page.title : '',
          score: page.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.5
        })));
      }

      // 搜索块内容
      if (searchFilters.type === 'all' || searchFilters.type === 'block') {
        const blocks = await get().searchBlocks(query, searchFilters.knowledgeBaseId);
        results.push(...blocks.map(block => ({
          type: 'block' as const,
          id: block.id,
          title: `Block in page ${block.page_id}`,
          content: block.content,
          highlight: get().highlightText(block.content, query),
          score: block.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.3
        })));
      }

      // 按相关性排序
      results.sort((a, b) => (b.score || 0) - (a.score || 0));

      set({ 
        searchResults: results, 
        isSearching: false 
      });

      // 添加到最近搜索
      get().addToRecentSearches(query);
    } catch (error) {
      console.error('搜索失败:', error);
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchResults: [],
      searchFilters: { type: 'all' }
    });
  },

  addToRecentSearches: (query: string) => {
    set(state => {
      const recentSearches = [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 10);
      localStorage.setItem('knowledgeSearchRecent', JSON.stringify(recentSearches));
      return { recentSearches };
    });
  },

  clearRecentSearches: () => {
    localStorage.removeItem('knowledgeSearchRecent');
    set({ recentSearches: [] });
  },

  setSearchFilters: (filters: Partial<SearchState['searchFilters']>) => {
    set(state => ({
      searchFilters: { ...state.searchFilters, ...filters }
    }));
  },

  searchPages: async (query: string, knowledgeBaseId?: string) => {
    try {
      return await DatabaseAPI.searchPages(query, knowledgeBaseId);
    } catch (error) {
      console.error('搜索页面失败:', error);
      return [];
    }
  },

  searchBlocks: async (query: string, knowledgeBaseId?: string) => {
    try {
      return await DatabaseAPI.searchBlocks(query, knowledgeBaseId);
    } catch (error) {
      console.error('搜索块失败:', error);
      return [];
    }
  },

  // Helper method to highlight search terms
  highlightText: (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}));