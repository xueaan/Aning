import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Note, Tag, SearchResult } from '@/types';

interface NoteStore {
  // 状态
  notes: Note[];
  tags: Tag[];
  searchResults: SearchResult[];
  isSearching: boolean;
  
  // Actions
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearching: (searching: boolean) => void;
  clearSearch: () => void;
  
  // 辅助方法
  getNoteById: (id: string) => Note | undefined;
  getNotesByTag: (tagName: string) => Note[];
  getRecentNotes: (limit?: number) => Note[];
}

export const useNoteStore = create<NoteStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      notes: [],
      tags: [],
      searchResults: [],
      isSearching: false,
      
      // Note Actions
      setNotes: (notes) => set({ notes }),
      
      addNote: (note) => set((state) => ({
        notes: [note, ...state.notes]
      })),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id ? { ...note, ...updates } : note
        )
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id)
      })),
      
      // Tag Actions
      setTags: (tags) => set({ tags }),
      
      addTag: (tag) => set((state) => ({
        tags: [...state.tags, tag]
      })),
      
      updateTag: (id, updates) => set((state) => ({
        tags: state.tags.map(tag => 
          tag.id === id ? { ...tag, ...updates } : tag
        )
      })),
      
      deleteTag: (id) => set((state) => ({
        tags: state.tags.filter(tag => tag.id !== id)
      })),
      
      // Search Actions
      setSearchResults: (results) => set({ searchResults: results }),
      
      setSearching: (searching) => set({ isSearching: searching }),
      
      clearSearch: () => set({ 
        searchResults: [], 
        isSearching: false 
      }),
      
      // 辅助方法
      getNoteById: (id) => {
        return get().notes.find(note => note.id === id);
      },
      
      getNotesByTag: (_tagName) => {
        // 暂时未使用，保留接口完整性
        // 这里需要实现根据标签过滤笔记的逻辑
        // 暂时返回空数组，后续在数据库集成时实现
        return [];
      },
      
      getRecentNotes: (limit = 10) => {
        const { notes } = get();
        return notes
          .filter(note => !note.is_deleted)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, limit);
      }
    }),
    {
      name: 'note-store'
    }
  )
);