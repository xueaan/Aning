import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TimelineEntry } from '@/types';

export type ViewMode = 'single' | 'three';


interface TimelineStore {
  // 状态
  entries: TimelineEntry[];
  isRecording: boolean;
  quickEntryOpen: boolean;
  currentDate: Date; // 当前查看的日期
  viewMode: ViewMode; // 视图模式
  
  // Actions
  setEntries: (entries: TimelineEntry[]) => void;
  addEntry: (entry: TimelineEntry) => void;
  updateEntry: (id: string, updates: Partial<TimelineEntry>) => void;
  deleteEntry: (id: string) => void;
  setRecording: (recording: boolean) => void;
  toggleQuickEntry: () => void;
  setQuickEntryOpen: (open: boolean) => void;
  
  // 日期导航 Actions
  setCurrentDate: (date: Date) => void;
  changeDate: (days: number) => void;
  goToToday: () => void;
  
  // 视图和状态 Actions
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  
  // 辅助方法
  getTodayEntries: () => TimelineEntry[];
  getEntriesByDate: (date: string) => TimelineEntry[];
  getUnconvertedEntries: () => TimelineEntry[];
}

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      entries: [],
      isRecording: false,
      quickEntryOpen: false,
      currentDate: new Date(),
      viewMode: 'single' as ViewMode,
      
      // Actions
      setEntries: (entries) => set({ entries }),
      
      addEntry: (entry) => set((state) => ({
        entries: [entry, ...state.entries]
      })),
      
      updateEntry: (id, updates) => set((state) => ({
        entries: state.entries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        )
      })),
      
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter(entry => entry.id !== id)
      })),
      
      setRecording: (recording) => set({ isRecording: recording }),
      
      toggleQuickEntry: () => set((state) => ({
        quickEntryOpen: !state.quickEntryOpen
      })),
      
      setQuickEntryOpen: (open) => set({ quickEntryOpen: open }),
      
      // 日期导航 Actions
      setCurrentDate: (date) => set({ currentDate: date }),
      
      changeDate: (days) => set((state) => {
        const newDate = new Date(state.currentDate);
        newDate.setDate(newDate.getDate() + days);
        return { currentDate: newDate };
      }),
      
      goToToday: () => set({ currentDate: new Date() }),
      
      // 视图和状态 Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      
      toggleViewMode: () => set((state) => ({
        viewMode: state.viewMode === 'single' ? 'three' : 'single'
      })),
      
      // 辅助方法
      getTodayEntries: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().entries.filter(entry => 
          entry.created_at.startsWith(today)
        );
      },
      
      getEntriesByDate: (date) => {
        return get().entries.filter(entry => 
          entry.created_at.startsWith(date)
        );
      },
      
      getUnconvertedEntries: () => {
        return get().entries.filter(entry => 
          !entry.converted_to_note_id
        );
      }
    }),
    {
      name: 'timeline-store'
    }
  )
);
