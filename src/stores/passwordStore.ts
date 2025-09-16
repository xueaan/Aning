import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import {
  PasswordCategory,
  PasswordEntry,
  PasswordEntryDisplay,
  PasswordGeneratorOptions,
  PasswordSearchFilters,
  PasswordSortOptions,
  PasswordStrengthResult,
  PasswordComponentState,
  DEFAULT_PASSWORD_GENERATOR_OPTIONS,
  DEFAULT_SORT_OPTIONS,
  DEFAULT_SEARCH_FILTERS,
  getPasswordStrength,
} from '@/types/password';

// API调用包装函数
const api = {
  // 分类管理
  getCategories: () => invoke<PasswordCategory[]>('get_password_categories'),
  createCategory: (name: string, icon: string, color?: string) =>
    invoke<number>('create_password_category', { name, icon, color }),
  updateCategory: (id: number, name: string, icon: string, color?: string) =>
    invoke<void>('update_password_category', { id, name, icon, color }),
  deleteCategory: (id: number) => invoke<void>('delete_password_category', { id }),

  // 密码条目管理
  getEntries: () => invoke<PasswordEntryDisplay[]>('get_password_entries'),
  getEntriesByCategory: (categoryId: number) =>
    invoke<PasswordEntryDisplay[]>('get_password_entries_by_category', { categoryId }),
  createEntry: (entry: PasswordEntry) => invoke<number>('create_password_entry', { entry }),
  updateEntry: (id: number, entry: PasswordEntry) =>
    invoke<void>('update_password_entry', { id, entry }),
  deleteEntry: (id: number) => invoke<void>('delete_password_entry', { id }),
  getDecryptedPassword: (entryId: number) => invoke<string>('get_decrypted_password', { entryId }),
  searchEntries: (query: string) =>
    invoke<PasswordEntryDisplay[]>('search_password_entries', { query }),
  getFavoriteEntries: () => invoke<PasswordEntryDisplay[]>('get_favorite_password_entries'),

  // 密码生成和安全性检查
  generatePassword: (options: PasswordGeneratorOptions) =>
    invoke<string>('generate_password', { options }),
  checkPasswordStrength: (password: string) =>
    invoke<number>('check_password_strength', { password }),
};

export interface PasswordStore extends PasswordComponentState {
  // 初始化和加载
  initializeStore: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadEntries: () => Promise<void>;

  // 分类操作
  createCategory: (name: string, icon: string, color?: string) => Promise<void>;
  updateCategory: (id: number, name: string, icon: string, color?: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  selectCategory: (category?: PasswordCategory) => void;

  // 密码条目操作
  createEntry: (entry: PasswordEntry) => Promise<void>;
  updateEntry: (id: number, entry: PasswordEntry) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  getDecryptedPassword: (entryId: number) => Promise<string>;

  // 搜索和过滤
  searchEntries: (query: string) => void;
  setFilters: (filters: Partial<PasswordSearchFilters>) => void;
  setSortOptions: (options: PasswordSortOptions) => void;
  clearSearch: () => void;

  // UI状态管理
  setSelectedEntry: (entry?: PasswordEntryDisplay) => void;
  setIsCreating: (creating: boolean) => void;
  setIsEditing: (editing: boolean, entry?: PasswordEntryDisplay) => void;

  // 密码生成器
  generatePassword: () => Promise<void>;
  setGeneratorOptions: (options: Partial<PasswordGeneratorOptions>) => void;
  checkPasswordStrength: (password: string) => Promise<PasswordStrengthResult>;

  // 辅助方法
  getFilteredAndSortedEntries: () => PasswordEntryDisplay[];
  getCategorizedEntries: () => Record<string, PasswordEntryDisplay[]>;
  getRecentEntries: (limit?: number) => PasswordEntryDisplay[];
  getFavoriteEntries: () => PasswordEntryDisplay[];

  // 错误处理
  setError: (error?: string) => void;
  clearError: () => void;
}

// 辅助函数：处理异步操作和错误
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  onError: (error: string) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Password store operation failed:', error);
    onError(error instanceof Error ? error.message : '操作失败');
    return null;
  }
};

export const usePasswordStore = create<PasswordStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        entries: [],
        categories: [],
        selectedCategory: undefined,
        selectedEntry: undefined,

        searchQuery: '',
        filters: { ...DEFAULT_SEARCH_FILTERS },
        sortOptions: { ...DEFAULT_SORT_OPTIONS },

        isCreating: false,
        isEditing: false,
        editingEntry: undefined,

        generatorOptions: { ...DEFAULT_PASSWORD_GENERATOR_OPTIONS },
        generatedPassword: undefined,

        vaultStatus: 'unlocked',
        masterPasswordAttempts: 0,

        isLoading: false,
        error: undefined,

        // 初始化和加载方法
        initializeStore: async () => {
          const state = get();

          // 避免重复初始化
          if (state.isLoading) return;

          set({ isLoading: true });

          try {
            // 直接加载所有数据
            await Promise.all([state.loadCategories(), state.loadEntries()]);
          } finally {
            set({ isLoading: false });
          }
        },

        loadCategories: async () => {
          const { setError } = get();

          const categories = await withErrorHandling(api.getCategories, setError);

          set({
            categories: categories || [],
          });
        },

        loadEntries: async () => {
          const { setError, selectedCategory } = get();

          const loadOperation = selectedCategory?.id
            ? () => api.getEntriesByCategory(selectedCategory.id!)
            : api.getEntries;

          const entries = await withErrorHandling(loadOperation, setError);

          // 将分类信息关联到条目
          const { categories } = get();
          const entriesWithCategories = (entries || []).map((entry) => ({
            ...entry,
            category: categories.find((cat) => cat.id === entry.category_id),
          }));

          set({
            entries: entriesWithCategories,
          });
        },

        // 分类操作
        createCategory: async (name, icon, color) => {
          const { setError, loadCategories } = get();

          const result = await withErrorHandling(
            () => api.createCategory(name, icon, color),
            setError
          );

          if (result !== null) {
            await loadCategories();
          }
        },

        updateCategory: async (id, name, icon, color) => {
          const { setError, loadCategories } = get();

          const result = await withErrorHandling(
            () => api.updateCategory(id, name, icon, color),
            setError
          );

          if (result !== null) {
            await loadCategories();
          }
        },

        deleteCategory: async (id) => {
          const { setError, loadCategories, loadEntries } = get();

          const result = await withErrorHandling(() => api.deleteCategory(id), setError);

          if (result !== null) {
            await Promise.all([loadCategories(), loadEntries()]);
            // 如果删除的是当前选中的分类，清除选择
            const { selectedCategory } = get();
            if (selectedCategory?.id === id) {
              set({ selectedCategory: undefined });
            }
          }
        },

        selectCategory: (category) => {
          set({ selectedCategory: category });
          // 选择分类后重新加载条目
          get().loadEntries();
        },

        // 密码条目操作
        createEntry: async (entry) => {
          const { setError, categories } = get();

          // 创建临时ID用于乐观更新
          const tempId = -Date.now(); // 使用负数避免与真实ID冲突
          const category = categories.find((cat) => cat.id === entry.category_id);

          // 乐观更新 - 立即添加到列表
          const newEntryDisplay: PasswordEntryDisplay = {
            ...entry,
            id: tempId,
            category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({
            entries: [newEntryDisplay, ...state.entries],
            isCreating: false,
          }));

          // 执行实际的API调用
          const result = await withErrorHandling(() => api.createEntry(entry), setError);

          if (result !== null) {
            // 成功后重新加载以获取真实ID
            await get().loadEntries();
          } else {
            // 失败时移除临时条目
            set((state) => ({
              entries: state.entries.filter((e) => e.id !== tempId),
              isCreating: true, // 重新打开创建窗口
            }));
          }
        },

        updateEntry: async (id, entry) => {
          const { setError, selectedEntry, categories } = get();

          // 先进行乐观更新 - 立即更新本地状态
          set((state) => ({
            entries: state.entries.map((e) => {
              if (e.id === id) {
                // 保留显示所需的字段，更新其他字段
                const category = categories.find((cat) => cat.id === entry.category_id);
                return {
                  ...e,
                  ...entry,
                  id: e.id, // 保留原有ID
                  category,
                  updated_at: new Date().toISOString(), // 更新时间戳
                };
              }
              return e;
            }),
            isEditing: false,
            editingEntry: undefined,
          }));

          // 如果更新的是当前选中的条目，同步更新选中状态
          if (selectedEntry?.id === id) {
            const { entries } = get();
            const updatedEntry = entries.find((e) => e.id === id);
            set({ selectedEntry: updatedEntry });
          }

          // 然后执行实际的API调用
          const result = await withErrorHandling(() => api.updateEntry(id, entry), setError);

          // 如果API调用失败，回滚更改并重新加载
          if (result === null) {
            await get().loadEntries();
          } else {
            // API成功后，异步重新加载以确保数据一致性
            // 但不会影响已经更新的UI
            setTimeout(() => {
              get().loadEntries();
            }, 100);
          }
        },

        deleteEntry: async (id) => {
          const { setError, loadEntries } = get();

          const result = await withErrorHandling(() => api.deleteEntry(id), setError);

          if (result !== null) {
            await loadEntries();
            // 如果删除的是当前选中的条目，清除选择
            const { selectedEntry } = get();
            if (selectedEntry?.id === id) {
              set({ selectedEntry: undefined });
            }
          }
        },

        toggleFavorite: async (id) => {
          const { entries, setError } = get();
          const entry = entries.find((e) => e.id === id);

          if (entry) {
            // 立即更新本地状态，提升响应速度
            set((state) => ({
              entries: state.entries.map((e) =>
                e.id === id ? { ...e, is_favorite: !e.is_favorite } : e
              ),
            }));

            const updatedEntry: PasswordEntry = {
              ...entry,
              is_favorite: !entry.is_favorite,
            };

            const result = await withErrorHandling(
              () => api.updateEntry(id, updatedEntry),
              setError
            );

            if (result === null) {
              // 如果失败，回滚更改
              set((state) => ({
                entries: state.entries.map((e) =>
                  e.id === id ? { ...e, is_favorite: entry.is_favorite } : e
                ),
              }));
            }
            // 不需要重新加载，本地状态已经是最新的
          }
        },

        getDecryptedPassword: async (entryId) => {
          const { setError } = get();

          const password = await withErrorHandling(
            () => api.getDecryptedPassword(entryId),
            setError
          );

          return password || '';
        },

        // 搜索和过滤
        searchEntries: async (query) => {
          set({ searchQuery: query, isLoading: true });

          if (query.trim()) {
            // 如果有搜索查询，从服务器搜索
            const { setError, categories } = get();

            const entries = await withErrorHandling(() => api.searchEntries(query), setError);

            // 将分类信息关联到搜索结果
            const entriesWithCategories = (entries || []).map((entry) => ({
              ...entry,
              category: categories.find((cat) => cat.id === entry.category_id),
            }));

            set({
              entries: entriesWithCategories,
              isLoading: false,
            });
          } else {
            // 如果清空搜索，重新加载所有条目
            await get().loadEntries();
            set({ isLoading: false });
          }
        },

        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
          }));
        },

        setSortOptions: (options) => {
          set({ sortOptions: options });
        },

        clearSearch: () => {
          set({
            searchQuery: '',
            filters: { ...DEFAULT_SEARCH_FILTERS },
          });
          get().loadEntries();
        },

        // UI状态管理
        setSelectedEntry: (entry) => {
          set({ selectedEntry: entry });
        },

        setIsCreating: (creating) => {
          set({
            isCreating: creating,
            isEditing: false,
            editingEntry: undefined,
          });
        },

        setIsEditing: (editing, entry) => {
          set({
            isEditing: editing,
            isCreating: false,
            editingEntry: entry,
          });
        },

        // 密码生成器
        generatePassword: async () => {
          const { generatorOptions, setError } = get();

          const password = await withErrorHandling(
            () => api.generatePassword(generatorOptions),
            setError
          );

          if (password) {
            set({ generatedPassword: password });
          }
        },

        setGeneratorOptions: (options) => {
          set((state) => ({
            generatorOptions: { ...state.generatorOptions, ...options },
          }));
        },

        checkPasswordStrength: async (password) => {
          const { setError } = get();

          const score = await withErrorHandling(
            () => api.checkPasswordStrength(password),
            setError
          );

          return getPasswordStrength(score || 0);
        },

        // 辅助方法
        getFilteredAndSortedEntries: () => {
          const { entries, filters, sortOptions, searchQuery } = get();

          let filtered = [...entries];

          // 应用过滤器
          if (filters.category_id) {
            filtered = filtered.filter((entry) => entry.category_id === filters.category_id);
          }

          if (filters.is_favorite !== undefined) {
            filtered = filtered.filter((entry) => entry.is_favorite === filters.is_favorite);
          }

          if (filters.has_url) {
            filtered = filtered.filter((entry) => entry.url && entry.url.trim() !== '');
          }

          // 标签筛选已移除

          // 客户端搜索（如果服务器端搜索未生效）
          if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (entry) =>
                entry.title.toLowerCase().includes(query) ||
                entry.username?.toLowerCase().includes(query) ||
                entry.url?.toLowerCase().includes(query) ||
                entry.app_name?.toLowerCase().includes(query) ||
                entry.ip?.toLowerCase().includes(query) ||
                entry.db_type?.toLowerCase().includes(query) ||
                entry.db_ip?.toLowerCase().includes(query) ||
                entry.db_username?.toLowerCase().includes(query)
            );
          }

          // 排序
          filtered.sort((a, b) => {
            const { sortBy, sortOrder } = sortOptions;
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
              case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
              case 'created_at':
                aValue = new Date(a.created_at || 0);
                bValue = new Date(b.created_at || 0);
                break;
              case 'updated_at':
                aValue = new Date(a.updated_at || 0);
                bValue = new Date(b.updated_at || 0);
                break;
              case 'last_used_at':
                aValue = new Date(a.last_used_at || 0);
                bValue = new Date(b.last_used_at || 0);
                break;
              case 'category':
                aValue = a.category?.name || '';
                bValue = b.category?.name || '';
                break;
              default:
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          });

          return filtered;
        },

        getCategorizedEntries: () => {
          const { getFilteredAndSortedEntries, categories } = get();
          const entries = getFilteredAndSortedEntries();

          const categorized: Record<string, PasswordEntryDisplay[]> = {
            未分类: [],
          };

          // 初始化分类
          categories.forEach((category) => {
            categorized[category.name] = [];
          });

          // 分类条目
          entries.forEach((entry) => {
            const categoryName = entry.category?.name || '未分类';
            if (!categorized[categoryName]) {
              categorized[categoryName] = [];
            }
            categorized[categoryName].push(entry);
          });

          // 移除空分类
          Object.keys(categorized).forEach((key) => {
            if (categorized[key].length === 0) {
              delete categorized[key];
            }
          });

          return categorized;
        },

        getRecentEntries: (limit = 10) => {
          const { entries } = get();
          return [...entries]
            .filter((entry) => entry.last_used_at)
            .sort(
              (a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime()
            )
            .slice(0, limit);
        },

        getFavoriteEntries: () => {
          const { entries } = get();
          return entries.filter((entry) => entry.is_favorite);
        },

        // 错误处理
        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: undefined });
        },
      }),
      {
        name: 'password-store',
        partialize: (state) => ({
          // 只持久化UI配置，不持久化敏感数据
          generatorOptions: state.generatorOptions,
          // 不持久化 vaultStatus, sessionId 等敏感状态
        }),
      }
    ),
    {
      name: 'password-store',
    }
  )
);

// 导出store的类型，方便其他地方使用
export type PasswordStoreType = typeof usePasswordStore;
