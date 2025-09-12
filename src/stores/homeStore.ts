import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  icon?: string; // emoji或图标URL
  color?: string; // 背景色
}

export interface HomeStore {
  // 状态
  shortcuts: Shortcut[];
  backgroundImage: string;
  
  // Actions
  addShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
  updateShortcut: (id: string, shortcut: Partial<Shortcut>) => void;
  deleteShortcut: (id: string) => void;
  reorderShortcuts: (shortcuts: Shortcut[]) => void;
  setBackgroundImage: (url: string) => void;
  resetToDefaults: () => void;
}

// 默认快捷方式
const defaultShortcuts: Shortcut[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#24292e' },
  { id: '2', title: 'Google', url: 'https://google.com', icon: '🔍', color: '#4285F4' },
  { id: '3', title: '知乎', url: 'https://zhihu.com', icon: '📚', color: '#0084FF' },
  { id: '4', title: 'Bilibili', url: 'https://bilibili.com', icon: '📺', color: '#00A1D6' },
  { id: '5', title: '微博', url: 'https://weibo.com', icon: '🐦', color: '#E6162D' },
  { id: '6', title: 'YouTube', url: 'https://youtube.com', icon: '▶️', color: '#FF0000' },
];

export const useHomeStore = create<HomeStore>()(
  persist(
    (set) => ({
      // 初始状态
      shortcuts: defaultShortcuts,
      backgroundImage: '',

      // 添加快捷方式
      addShortcut: (shortcut) => {
        const newShortcut: Shortcut = {
          ...shortcut,
          id: Date.now().toString()
        };
        set(state => ({
          shortcuts: [...state.shortcuts, newShortcut]
        }));
      },

      // 更新快捷方式
      updateShortcut: (id, shortcut) => {
        set(state => ({
          shortcuts: state.shortcuts.map(s => 
            s.id === id ? { ...s, ...shortcut } : s
          )
        }));
      },

      // 删除快捷方式
      deleteShortcut: (id) => {
        set(state => ({
          shortcuts: state.shortcuts.filter(s => s.id !== id)
        }));
      },

      // 重新排序快捷方式
      reorderShortcuts: (shortcuts) => {
        set({ shortcuts });
      },

      // 设置背景图片
      setBackgroundImage: (url) => {
        set({ backgroundImage: url });
      },

      // 重置为默认设置
      resetToDefaults: () => {
        set({
          shortcuts: defaultShortcuts,
          backgroundImage: ''
        });
      }}),
    {
      name: 'home-storage', // localStorage的key
      partialize: (state) => ({
        shortcuts: state.shortcuts,
        backgroundImage: state.backgroundImage
      })
    }
  )
);



