import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invokeTauri } from '@/utils/tauriWrapper';
import {
  DialogueContext,
  ContextItem,
  MentionSuggestion,
  SuggestionGroups,
  ContextLoadingState,
  ContextActionResult,
  ContextStats,
  ContextSearchOptions,
  DEFAULT_CONTEXT_CONFIG,
  SHORTCUT_MENTIONS,
  TOKEN_ESTIMATES,
} from '@/types/dialogue';
import { type Page } from '@/types/database';

// API 响应类型定义
interface SearchResult extends Page {
  content?: string;
  kb_name?: string;
  parent_title?: string;
  score?: number;
}

type PageDataResponse = SearchResult;

interface TaskDataResponse {
  id: number;
  title: string;
  content: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  project_id?: number;
  project_name?: string;
  created_at: string;
  updated_at: string;
  score?: number;
}

// 上下文存储接口
export interface DialogueContextStore {
  // 核心状态
  activeContexts: Map<string, ContextItem>;
  currentContext: DialogueContext | null;
  contextHistory: Map<string, DialogueContext>; // conversationId -> context

  // 搜索和建议
  suggestions: MentionSuggestion[];
  suggestionGroups: SuggestionGroups | null;
  lastSearchQuery: string;

  // 加载状态
  loadingState: ContextLoadingState;

  // 统计信息
  stats: ContextStats;

  // 缓存
  searchCache: Map<string, SuggestionGroups>;
  contextCache: Map<string, ContextItem>;

  // Actions - 上下文管理
  addContext: (item: ContextItem) => void;
  removeContext: (id: string) => void;
  clearAllContexts: () => void;
  updateContextItem: (id: string, updates: Partial<ContextItem>) => void;
  reorderContexts: (orderedIds: string[]) => void;

  // Actions - 数据加载
  loadContextFromMention: (mention: string) => Promise<ContextActionResult>;
  loadMultipleContexts: (mentions: string[]) => Promise<ContextActionResult[]>;
  refreshContext: (id: string) => Promise<ContextActionResult>;

  // Actions - 搜索和建议
  searchSuggestions: (query: string, options?: ContextSearchOptions) => Promise<void>;
  getShortcutSuggestions: () => MentionSuggestion[];
  clearSuggestions: () => void;
  add: (context: ContextItem) => void;
  remove: (id: string) => void;

  // Actions - 会话管理
  saveContextToConversation: (conversationId: string) => void;
  loadContextFromConversation: (conversationId: string) => void;
  createContextSnapshot: () => DialogueContext;
  restoreFromSnapshot: (snapshot: DialogueContext) => void;

  // Actions - 实用工具
  calculateStats: () => void;
  estimateTokens: (content: string) => number;
  exportContext: (format: 'json' | 'markdown' | 'text') => string;
  importContext: (data: string, format: 'json') => Promise<void>;

  // Actions - 缓存管理
  clearCaches: () => void;
  purgeDualCache: () => void;
  getCacheSize: () => { searchCache: number; contextCache: number };
}

// Token估算辅助函数
const estimateTokensForText = (text: string): number => {
  if (!text) return 0;

  // 简单的token估算逻辑
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const punctuation = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length;

  return Math.ceil(
    chineseChars * TOKEN_ESTIMATES.CHINESE_CHAR +
      englishWords * TOKEN_ESTIMATES.ENGLISH_WORD +
      punctuation * TOKEN_ESTIMATES.PUNCTUATION
  );
};

// 生成唯一ID
const generateId = () => `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useDialogueContextStore = create<DialogueContextStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      activeContexts: new Map(),
      currentContext: null,
      contextHistory: new Map(),

      suggestions: [],
      suggestionGroups: null,
      lastSearchQuery: '',
      loadingState: {
        isLoading: false,
        loadingItems: new Set(),
        error: undefined,
      },
      stats: {
        totalItems: 0,
        knowledges: 0,
        tasks: 0,
        totalTokens: 0,
      },
      searchCache: new Map(),
      contextCache: new Map(),

      // 上下文管理
      addContext: (item: ContextItem) => {
        set((state) => {
          const newContexts = new Map(state.activeContexts);

          // 检查是否超过限制
          if (newContexts.size >= DEFAULT_CONTEXT_CONFIG.MAX_ITEMS) {
            return state;
          }

          // 检查token限制
          const totalTokens =
            Array.from(newContexts.values()).reduce((sum, ctx) => sum + (ctx.tokenCount || 0), 0) +
            (item.tokenCount || 0);

          if (totalTokens > DEFAULT_CONTEXT_CONFIG.MAX_TOKENS) {
            return state;
          }

          newContexts.set(item.id, item);

          return {
            ...state,
            activeContexts: newContexts,
          };
        });

        // 重新计算统计信息
        get().calculateStats();
      },

      removeContext: (id: string) => {
        set((state) => {
          const newContexts = new Map(state.activeContexts);
          newContexts.delete(id);

          return {
            ...state,
            activeContexts: newContexts,
          };
        });

        get().calculateStats();
      },

      clearAllContexts: () => {
        set((state) => ({
          ...state,
          activeContexts: new Map(),
          currentContext: null,
        }));

        get().calculateStats();
      },

      updateContextItem: (id: string, updates: Partial<ContextItem>) => {
        set((state) => {
          const newContexts = new Map(state.activeContexts);
          const existing = newContexts.get(id);

          if (existing) {
            const updated = { ...existing, ...updates };
            newContexts.set(id, updated);
          }

          return {
            ...state,
            activeContexts: newContexts,
          };
        });
      },

      reorderContexts: (orderedIds: string[]) => {
        set((state) => {
          const newContexts = new Map();

          // 按照给定顺序重新排列
          orderedIds.forEach((id) => {
            const item = state.activeContexts.get(id);
            if (item) {
              newContexts.set(id, item);
            }
          });

          return {
            ...state,
            activeContexts: newContexts,
          };
        });
      },

      // 数据加载
      loadContextFromMention: async (mention: string): Promise<ContextActionResult> => {
        const state = get();
        const loadingId = generateId();

        // 设置加载状态
        set((state) => ({
          ...state,
          loadingState: {
            ...state.loadingState,
            isLoading: true,
            loadingItems: new Set([...state.loadingState.loadingItems, loadingId]),
          },
        }));

        try {
          // 检查缓存
          const cached = state.contextCache.get(mention);
          if (cached) {
            return { success: true, item: cached };
          }

          let contextItem: ContextItem;

          // 解析提及类型
          if (mention.startsWith('@task:')) {
            const taskId = mention.replace('@task:', '');
            const taskData = (await invokeTauri('get_task_for_context', {
              taskId: parseInt(taskId),
            })) as TaskDataResponse;

            contextItem = {
              id: generateId(),
              type: 'task',
              title: taskData.title,
              content: taskData.description || '',
              source: {
                module: 'taskbox',
                id: parseInt(taskId),
              },
              metadata: {
                status: taskData.status,
                priority: taskData.priority,
                due_date: taskData.due_date,
                project_id: taskData.project_id,
                project_name: taskData.project_name,
                created_at: taskData.created_at,
                updated_at: taskData.updated_at,
                preview: taskData.description?.substring(0, DEFAULT_CONTEXT_CONFIG.PREVIEW_LENGTH),
              },
              addedAt: Date.now(),
              tokenCount:
                estimateTokensForText(taskData.description || '') + TOKEN_ESTIMATES.TASK_METADATA,
            };
          } else if (mention.startsWith('@tasks:')) {
            // 处理任务列表快捷方式
            const filter = mention.replace('@tasks:', '');
            const tasksData = (await invokeTauri('get_tasks_by_filter', {
              filter,
            })) as TaskDataResponse[];

            const task = tasksData
              .map((task) => `• ${task.title}${task.due_date ? ` (${task.due_date})` : ''}`)
              .join('\n');

            contextItem = {
              id: generateId(),
              type: 'task_list',
              title: (() => {
                const shortcut = SHORTCUT_MENTIONS.find((shortcut) => shortcut.value === mention);
                return shortcut ? shortcut.label || '任务列表' : '任务列表';
              })(),
              content: task,
              source: {
                module: 'taskbox',
                id: filter,
              },
              metadata: {
                preview: `包含${tasksData.length}个任务`,
              },
              addedAt: Date.now(),
              tokenCount: estimateTokensForText(task) + TOKEN_ESTIMATES.TASK_METADATA,
            };
          } else if (mention.startsWith('@pages:')) {
            // 处理页面列表快捷方式
            const filter = mention.replace('@pages:', '');
            const pagesData = (await invokeTauri('get_pages_by_filter', {
              filter,
            })) as PageDataResponse[];

            const pages = pagesData.map((page) => `• ${page.title}`).join('\n');

            contextItem = {
              id: generateId(),
              type: 'knowledge_page',
              title: (() => {
                const shortcut = SHORTCUT_MENTIONS.find((shortcut) => shortcut.value === mention);
                return shortcut ? shortcut.label || '页面列表' : '页面列表';
              })(),
              content: pages,
              source: {
                module: 'knowledge',
                id: filter,
              },
              metadata: {
                preview: `包含${pagesData.length}个页面`,
              },
              addedAt: Date.now(),
              tokenCount: estimateTokensForText(pages) + TOKEN_ESTIMATES.PAGE_METADATA,
            };
          } else {
            throw new Error(`未支持的提及格式: ${mention}`);
          }

          // 缓存结果
          state.contextCache.set(mention, contextItem);

          // 添加到活动上下文
          get().addContext(contextItem);

          return {
            success: true,
            item: contextItem,
            message: '上下文加载成功',
          };
        } catch (error) {
          console.error('加载上下文失败:', {
            mention,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return {
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
          };
        } finally {
          // 清除加载状态
          set((state) => ({
            ...state,
            loadingState: {
              ...state.loadingState,
              isLoading: state.loadingState.loadingItems.size <= 1,
              loadingItems: new Set(
                [...state.loadingState.loadingItems].filter((id) => id !== loadingId)
              ),
            },
          }));
        }
      },

      loadMultipleContexts: async (mentions: string[]): Promise<ContextActionResult[]> => {
        const results = await Promise.all(
          mentions.map((mention) => get().loadContextFromMention(mention))
        );
        return results;
      },

      refreshContext: async (id: string): Promise<ContextActionResult> => {
        const state = get();
        const existingItem = state.activeContexts.get(id);

        if (!existingItem) {
          return { success: false, error: '找不到指定的上下文项' };
        }

        // 构建提及字符串
        let mention: string;
        if (existingItem.type === 'task') {
          mention = `@task:${existingItem.source?.id || ''}`;
        } else {
          mention = `@tasks:${existingItem.source?.id || ''}`;
        }

        // 先移除现有项目
        get().removeContext(id);

        // 清除缓存
        state.contextCache.delete(mention);

        // 重新加载
        return await get().loadContextFromMention(mention);
      },

      // 搜索和建议
      searchSuggestions: async (query: string, options?: ContextSearchOptions): Promise<void> => {
        if (!query.trim()) {
          set((state) => ({
            ...state,
            suggestions: [],
            suggestionGroups: null,
            lastSearchQuery: '',
          }));
          return;
        }

        const state = get();

        // 检查缓存
        const cacheKey = `${query}-${JSON.stringify(options || {})}`;
        const cached = state.searchCache.get(cacheKey);
        if (cached && state.lastSearchQuery !== query) {
          set((state) => ({
            ...state,
            suggestionGroups: cached,
            suggestions: cached.groups.flatMap((g) => g.items),
            lastSearchQuery: query,
          }));
          return;
        }

        try {
          // 搜索知识库页面
          const pageResults = (await invokeTauri('search_knowledge_pages', {
            query,
            kbId: options?.knowledgeBase,
            limit: options?.limit || DEFAULT_CONTEXT_CONFIG.SEARCH_LIMIT,
          })) as PageDataResponse[];

          // 搜索任务
          const taskResults = (await invokeTauri('search_tasks', {
            query,
            includeCompleted: false,
            projectId: options?.taskProject,
            limit: options?.limit || DEFAULT_CONTEXT_CONFIG.SEARCH_LIMIT,
          })) as TaskDataResponse[];

          // 构建建议组
          const groups: Array<{
            type: 'knowledge' | 'tasks';
            title: string;
            icon: string;
            items: MentionSuggestion[];
          }> = [];

          if (pageResults.length > 0) {
            groups.push({
              type: 'knowledge' as const,
              title: '知识库页面',
              icon: '📄',
              items: pageResults.map((page) => ({
                label: page.title,
                value: `@page:${page.id}`,
                icon: '📄',
                preview: page.content?.substring(0, 50),
                type: 'page' as const,
                metadata: {
                  kb_name: page.kb_name,
                  parent_title: page.parent_title,
                  score: page.score,
                  tokens: estimateTokensForText(page.content || ''),
                },
              })),
            });
          }

          if (taskResults.length > 0) {
            groups.push({
              type: 'tasks' as const,
              title: '任务',
              icon: '✅',
              items: taskResults.map((task) => ({
                label: task.title,
                value: `@task:${task.id}`,
                icon:
                  task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳',
                preview: task.description?.substring(0, 50),
                type: 'task' as const,
                metadata: {
                  status: task.status,
                  priority: task.priority,
                  project: task.project_name,
                  due_date: task.due_date,
                  score: task.score,
                  tokens: estimateTokensForText(task.description || ''),
                },
              })),
            });
          }

          const suggestionGroups = {
            groups,
            total: pageResults.length + taskResults.length,
            hasMore: false, // TODO: 实现分页
          };

          // 缓存结果
          state.searchCache.set(cacheKey, suggestionGroups);

          set((state) => ({
            ...state,
            suggestionGroups,
            suggestions: groups.flatMap((g) => g.items),
            lastSearchQuery: query,
          }));
        } catch (error) {
          console.error('搜索建议失败:', error);
          set((state) => ({
            ...state,
            loadingState: {
              ...state.loadingState,
              error: error instanceof Error ? error.message : '搜索失败',
            },
          }));
        }
      },

      getShortcutSuggestions: (): MentionSuggestion[] => {
        return Object.values(SHORTCUT_MENTIONS).map((shortcut) => ({
          label: shortcut.label,
          value: shortcut.value,
          icon: shortcut.icon,
          preview: shortcut.description,
          type: 'shortcut' as const,
        }));
      },

      clearSuggestions: () => {
        set((state) => ({
          ...state,
          suggestions: [],
          suggestionGroups: null,
          lastSearchQuery: '',
        }));
      },

      // Aliases for addContext and removeContext to match interface
      add: (context: ContextItem) => {
        get().addContext(context);
      },

      remove: (id: string) => {
        get().removeContext(id);
      },

      // 会话管理
      saveContextToConversation: (conversationId: string) => {
        const snapshot = get().createContextSnapshot();

        set((state) => ({
          ...state,
          contextHistory: new Map(state.contextHistory).set(conversationId, snapshot),
        }));
      },

      loadContextFromConversation: (conversationId: string) => {
        const state = get();
        const savedContext = state.contextHistory.get(conversationId);

        if (savedContext) {
          get().restoreFromSnapshot(savedContext);
        }
      },

      createContextSnapshot: (): DialogueContext => {
        const state = get();
        return {
          id: generateId(),
          type:
            state.activeContexts.size === 0
              ? 'mixed'
              : Array.from(state.activeContexts.values()).every((item) =>
                    item.type.includes('knowledge')
                  )
                ? 'knowledge'
                : Array.from(state.activeContexts.values()).every((item) =>
                      item.type.includes('task')
                    )
                  ? 'task'
                  : 'mixed',
          items: Array.from(state.activeContexts.values()),
          totalTokens: state.stats.totalTokens,
          createdAt: Date.now(),
        };
      },

      restoreFromSnapshot: (snapshot: DialogueContext) => {
        const newContexts = new Map();
        snapshot.items.forEach((item) => {
          newContexts.set(item.id, item);
        });

        set((state) => ({
          ...state,
          activeContexts: newContexts,
          currentContext: snapshot,
        }));

        get().calculateStats();
      },

      // 实用工具
      calculateStats: () => {
        const state = get();
        const items = Array.from(state.activeContexts.values());

        set((state) => ({
          ...state,
          stats: {
            totalItems: items.length,
            knowledges: items.filter((item) => item.type === 'knowledge_page').length,
            tasks: items.filter((item) => item.type.includes('task')).length,
            totalTokens: items.reduce((sum, item) => sum + (item.tokenCount || 0), 0),
          },
        }));
      },

      estimateTokens: estimateTokensForText,

      exportContext: (format: 'json' | 'markdown' | 'text'): string => {
        const state = get();
        const items = Array.from(state.activeContexts.values());

        if (format === 'json') {
          return JSON.stringify(
            {
              context: get().createContextSnapshot(),
              exportedAt: Date.now(),
              format,
            },
            null,
            2
          );
        } else if (format === 'markdown') {
          return items
            .map((item) => {
              return `## ${item.title}\n\n${item.content}\n\n---\n`;
            })
            .join('\n');
        } else {
          return items
            .map((item) => {
              return `${item.title}\n${'='.repeat(item.title.length)}\n\n${item.content}\n\n`;
            })
            .join('\n');
        }
      },

      importContext: async (data: string, format: 'json'): Promise<void> => {
        if (format === 'json') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.context && parsed.context.items) {
              get().restoreFromSnapshot(parsed.context);
            }
          } catch (error) {
            throw new Error('JSON格式无效');
          }
        }
      },

      // 缓存管理
      clearCaches: () => {
        set((state) => ({
          ...state,
          searchCache: new Map(),
          contextCache: new Map(),
        }));
      },

      purgeDualCache: () => {
        const state = get();

        // 清理超过TTL的搜索缓存
        const newSearchCache = new Map();
        state.searchCache.forEach((value: any, key: string) => {
          // 这里需要记录缓存时间，暂时保留所有缓存
          newSearchCache.set(key, value);
        });

        set((state) => ({
          ...state,
          searchCache: newSearchCache,
        }));
      },

      getCacheSize: () => {
        const state = get();
        return {
          searchCache: state.searchCache.size,
          contextCache: state.contextCache.size,
        };
      },

      // Web 搜索 Actions
    }),
    {
      name: 'dialogue-context-store',
      partialize: (state: DialogueContextStore) => ({
        // 只持久化必要的数据
        contextHistory: Array.from(state.contextHistory.entries()),
        activeContexts: Array.from(state.activeContexts.entries()),
      }),
      merge: (persistedState: any, currentState: DialogueContextStore) => ({
        ...currentState,
        contextHistory: new Map(persistedState?.contextHistory || []),
        activeContexts: new Map(persistedState?.activeContexts || []),
      }),
    }
  )
);
