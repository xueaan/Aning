import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppModule, AppState, Note } from '@/types';
import {
  AiConfigStore,
  AiProviderType,
  AiConfig,
  DEFAULT_AI_CONFIG,
  AiChatState,
  AiConversation,
  AiMessage,
  AiAgent,
  generateAgentId,
} from '@/types/aiConfig';
import { AiDatabaseSync, AiAutoSync } from '@/utils/aiDatabaseSync';
import { AiConfigSync } from '@/services/ai/aiConfigSync';

// 导航历史
export interface NavigationItem {
  moduleId: string;
  noteId?: string;
  timestamp: number;
  title?: string;
}

// 响应式断点类型
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 用户覆盖状态
export interface UserOverride {
  leftSidebar: boolean;
  rightSidebar: boolean;
}

interface AppStore extends AppState {
  // 当前笔记状态
  currentNote?: Note;

  // 左侧栏状态
  leftSidebarWidth: number;

  // 右侧面板状态
  rightPanelOpen: boolean;
  rightPanelWidth: number;

  // 导航历史
  navigationHistory: NavigationItem[];
  navigationIndex: number;

  // 响应式状态
  windowWidth: number;
  breakpoint: Breakpoint;
  userOverride: UserOverride;

  // 主题状态
  gradientTheme: string;
  noiseLevel: number;
  gradientAngle: number; // 渐变角度 0-360
  blendMode: number; // 混合模式 0=暗 50=原色 100=亮

  // 字体状态
  fontFamily: string; // 界面字体
  editorFontFamily: string; // 编辑器字体

  // 设置弹窗状态
  settingsModalOpen: boolean;

  // AI 配置状态
  aiConfig: AiConfigStore;

  // AI 对话状态
  aiChat: AiChatState;

  // 知识库状态
  lastUsedKnowledgeBaseId: string | null;

  // Actions
  setCurrentNote: (note?: Note) => void;
  setCurrentModule: (module: AppModule) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setGradientTheme: (theme: string) => void;
  setNoiseLevel: (level: number) => void;
  setGradientAngle: (angle: number) => void;
  setBlendMode: (mode: number) => void;

  // 字体 Actions
  setFontFamily: (font: string) => void;
  setEditorFontFamily: (font: string) => void;

  // 左侧面板 Actions
  setLeftSidebarWidth: (width: number) => void;

  // 右侧面板 Actions
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelWidth: (width: number) => void;

  // 导航历史 Actions
  addToHistory: (item: NavigationItem) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  clearHistory: () => void;

  // 响应式 Actions
  setWindowWidth: (width: number) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setUserOverride: (override: UserOverride) => void;

  // 设置弹窗 Actions
  setSettingsModalOpen: (open: boolean) => void;
  toggleSettingsModal: () => void;

  // AI 配置 Actions
  setAiConfig: (provider: AiProviderType, config: AiConfig) => void;
  setCurrentAiProvider: (provider: AiProviderType) => void;
  updateAiConfig: (provider: AiProviderType, updates: Partial<AiConfig>) => void;

  // AI 对话 Actions
  createConversation: () => string;
  setCurrentConversation: (conversationId: string | null) => Promise<void>;
  addMessage: (message: Omit<AiMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<AiMessage>) => void;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  deleteConversation: (conversationId: string) => void;
  clearAllConversations: () => void;
  cleanupOldConversations: (daysToKeep?: number) => void;
  setAiChatLoading: (loading: boolean) => void;
  setAiChatLoadingConversation: (loading: boolean) => void;
  setAiChatError: (error: string | null) => void;

  // AI 智能体 Actions
  setCurrentAgent: (agentId: string) => void;
  addAgent: (agent: Omit<AiAgent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAgent: (
    agentId: string,
    updates: Partial<Omit<AiAgent, 'id' | 'isBuiltIn' | 'createdAt'>>
  ) => void;
  deleteAgent: (agentId: string) => void;

  // 知识库 Actions
  setLastUsedKnowledgeBaseId: (id: string | null) => void;

  // 初始化应用
  initializeApp: () => Promise<void>;

  // 数据库加载
  loadConversationsFromDatabase: () => Promise<void>;

  // AI配置数据迁移和加载
  migrateAiConfigIfNeeded: () => Promise<void>;
  loadAiConfigFromDatabase: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentNote: undefined,
        currentModule: 'home',
        isLoading: false, // 🔥 永远不阻塞界面显示
        sidebarOpen: true,
        theme: 'dark',

        // 左侧栏状态
        leftSidebarWidth: 240,

        // 右侧面板状态
        rightPanelOpen: false,
        rightPanelWidth: 320,

        // 导航历史 - 初始化时添加首页作为第一条记录
        navigationHistory: [
          {
            moduleId: 'home',
            timestamp: Date.now(),
            title: '首页',
          },
        ],
        navigationIndex: 0,

        // 响应式状态
        windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
        breakpoint: 'lg' as Breakpoint,
        userOverride: { leftSidebar: false, rightSidebar: false },

        // 主题状态
        gradientTheme: 'pastel',
        noiseLevel: 50,
        gradientAngle: 135, // 默认135度
        blendMode: 50, // 默认原色

        // 字体状态
        fontFamily: 'system', // 默认系统字体
        editorFontFamily: 'default', // 默认编辑器字体

        // 设置弹窗状态
        settingsModalOpen: false,

        // AI 配置状态
        aiConfig: DEFAULT_AI_CONFIG,

        // AI 对话状态
        aiChat: {
          conversations: [],
          currentConversationId: null,
          isLoading: false,
          isLoadingConversation: false,
          error: null,
          contextEnabled: true,
          activeContextId: null,
        },

        // 知识库状态
        lastUsedKnowledgeBaseId: null,

        // Actions
        setCurrentNote: (note) => set({ currentNote: note }),

        setCurrentModule: (module) => {
          const state = get();

          // 如果是同一个模块，不添加新的历史记录
          if (state.currentModule === module) {
            console.log('[Navigation] 同一模块，跳过历史记录');
            return;
          }

          const newItem: NavigationItem = {
            moduleId: module,
            noteId: state.currentNote?.id,
            timestamp: Date.now(),
          };

          // 检查最后一个历史记录是否相同（避免重复）
          const currentItem = state.navigationHistory[state.navigationIndex];
          if (
            currentItem &&
            currentItem.moduleId === module &&
            currentItem.noteId === state.currentNote?.id
          ) {
            console.log('[Navigation] 重复的历史记录，跳过');
            return;
          }

          // 添加到历史记录，移除当前索引之后的记录
          const newHistory = state.navigationHistory.slice(0, state.navigationIndex + 1);
          newHistory.push(newItem);

          // 限制历史记录最大数量为50
          const MAX_HISTORY = 50;
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift(); // 移除最旧的记录
          }

          console.log('[Navigation] 添加历史记录:', module, '历史长度:', newHistory.length);

          set({
            currentModule: module,
            navigationHistory: newHistory,
            navigationIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
          });
        },

        setLoading: (loading) => set({ isLoading: loading }),

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        toggleTheme: () => {
          const newTheme = get().theme === 'light' ? 'dark' : 'light';

          // 添加切换动画效果
          document.documentElement.classList.add('theme-switching');

          // 更新主题
          set({ theme: newTheme });

          // 更新DOM类名和data-theme属性
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          }

          // 移除动画效果
          setTimeout(() => {
            document.documentElement.classList.remove('theme-switching');
          }, 300);
        },

        setTheme: (theme) => {
          set({ theme });

          // 更新DOM类名和data-theme属性
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          } else {
            // auto模式: 根据系统偏好
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
            }
          }
        },

        setGradientTheme: (theme) => set({ gradientTheme: theme }),

        setNoiseLevel: (level) => set({ noiseLevel: level }),

        setGradientAngle: (angle) => set({ gradientAngle: angle }),

        setBlendMode: (mode) => set({ blendMode: mode }),

        // 字体设置
        setFontFamily: (font) => set({ fontFamily: font }),
        setEditorFontFamily: (font) => set({ editorFontFamily: font }),

        // 左侧面板 Actions
        setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),

        // 右侧面板 Actions
        setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
        setRightPanelWidth: (width) => set({ rightPanelWidth: width }),

        // 导航历史 Actions
        addToHistory: (item) => {
          const state = get();
          const newHistory = state.navigationHistory.slice(0, state.navigationIndex + 1);
          newHistory.push(item);

          set({
            navigationHistory: newHistory,
            navigationIndex: newHistory.length - 1,
          });
        },

        navigateBack: () => {
          const state = get();

          // 边界检查
          if (!state.navigationHistory || state.navigationHistory.length === 0) {
            console.warn('[Navigation] 没有历史记录');
            return;
          }

          if (state.navigationIndex > 0) {
            const newIndex = state.navigationIndex - 1;
            const item = state.navigationHistory[newIndex];

            if (!item) {
              console.error('[Navigation] 无效的历史记录项:', newIndex);
              return;
            }

            console.log('[Navigation] 后退到:', item.moduleId, '索引:', newIndex);

            set({
              navigationIndex: newIndex,
              currentModule: item.moduleId as AppModule,
              currentNote: item.noteId ? ({ id: item.noteId } as any) : undefined,
            });
          } else {
            console.log('[Navigation] 已经是第一条历史记录');
          }
        },

        navigateForward: () => {
          const state = get();

          // 边界检查
          if (!state.navigationHistory || state.navigationHistory.length === 0) {
            console.warn('[Navigation] 没有历史记录');
            return;
          }

          if (state.navigationIndex < state.navigationHistory.length - 1) {
            const newIndex = state.navigationIndex + 1;
            const item = state.navigationHistory[newIndex];

            if (!item) {
              console.error('[Navigation] 无效的历史记录项:', newIndex);
              return;
            }

            console.log('[Navigation] 前进到:', item.moduleId, '索引:', newIndex);

            set({
              navigationIndex: newIndex,
              currentModule: item.moduleId as AppModule,
              currentNote: item.noteId ? ({ id: item.noteId } as any) : undefined,
            });
          } else {
            console.log('[Navigation] 已经是最后一条历史记录');
          }
        },

        clearHistory: () => {
          const { currentModule } = get();
          const initialItem: NavigationItem = {
            moduleId: currentModule,
            timestamp: Date.now(),
            title: '首页',
          };

          set({
            navigationHistory: [initialItem],
            navigationIndex: 0,
          });
        },

        // 响应式 Actions
        setWindowWidth: (width) => set({ windowWidth: width }),

        setBreakpoint: (breakpoint) => set({ breakpoint }),

        setUserOverride: (override) => set({ userOverride: override }),

        // 设置弹窗 Actions
        setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),

        toggleSettingsModal: () => {
          set((state) => ({
            settingsModalOpen: !state.settingsModalOpen,
          }));
        },

        // AI 配置 Actions
        setAiConfig: (provider, config) => {
          set((state) => ({
            aiConfig: {
              ...state.aiConfig,
              [provider]: config,
            },
          }));

          // 异步同步到数据库
          AiConfigSync.saveAiProvider(provider, config).catch((error) => {
            console.error('同步AI提供商配置到数据库失败', error);
          });
        },

        setCurrentAiProvider: (provider) => {
          set((state) => ({
            aiConfig: {
              ...state.aiConfig,
              currentProvider: provider,
            },
          }));

          // 异步同步到数据库
          AiConfigSync.setCurrentAiProvider(provider).catch((error) => {
            console.error('设置当前AI提供商失败', error);
          });
        },

        updateAiConfig: (provider, updates) => {
          set((state) => {
            const updatedConfig = {
              ...state.aiConfig[provider],
              ...updates,
            };

            // 异步同步到数据库
            AiConfigSync.saveAiProvider(provider, updatedConfig).catch((error) => {
              console.error('同步AI提供商配置到数据库失败', error);
            });

            return {
              aiConfig: {
                ...state.aiConfig,
                [provider]: updatedConfig,
              },
            };
          });
        },

        // AI 对话 Actions
        createConversation: () => {
          const state = get();
          const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const currentProvider = state.aiConfig.currentProvider;
          const currentConfig = state.aiConfig[currentProvider];

          const newConversation: AiConversation = {
            id: conversationId,
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            provider: currentProvider,
            model: currentConfig.model,
          };

          // 自动同步到数据库
          AiAutoSync.autoSyncConversation(newConversation);

          set((state) => {
            let conversations = [newConversation, ...state.aiChat.conversations];

            // 限制对话数量，避免localStorage过大（最多保存50个对话）
            const MAX_CONVERSATIONS = 50;
            if (conversations.length > MAX_CONVERSATIONS) {
              conversations = conversations.slice(0, MAX_CONVERSATIONS);
            }

            return {
              aiChat: {
                ...state.aiChat,
                conversations,
                currentConversationId: conversationId,
              },
            };
          });

          return conversationId;
        },

        setCurrentConversation: async (conversationId) => {
          if (!conversationId) {
            set((state) => ({
              aiChat: {
                ...state.aiChat,
                currentConversationId: null,
              },
            }));
            return;
          }

          // 先设置当前对话ID
          set((state) => ({
            aiChat: {
              ...state.aiChat,
              currentConversationId: conversationId,
            },
          }));

          // 检查对话是否已经有消息，如果没有则从数据库加载
          const state = get();
          const conversation = state.aiChat.conversations.find((c) => c.id === conversationId);

          if (conversation && conversation.messages.length === 0) {
            // 设置加载状态
            get().setAiChatLoadingConversation(true);

            try {
              // 从数据库加载完整对话详情
              const detailConversation =
                await AiDatabaseSync.loadConversationDetail(conversationId);

              if (detailConversation && detailConversation.messages.length > 0) {
                // 更新对话数据，包含消息
                set((state) => ({
                  aiChat: {
                    ...state.aiChat,
                    conversations: state.aiChat.conversations.map((conv) =>
                      conv.id === conversationId ? detailConversation : conv
                    ),
                  },
                }));
              }
            } catch (error) {
              console.error('加载对话详情失败:', error);
              get().setAiChatError('加载对话失败，请重试');
            } finally {
              // 清除加载状态
              get().setAiChatLoadingConversation(false);
            }
          }
        },

        addMessage: (message) => {
          const state = get();
          const currentConversationId = state.aiChat.currentConversationId;

          if (!currentConversationId) return;

          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // 限制消息内容长度，避免存储过大内容
          const MAX_MESSAGE_LENGTH = 10000;
          const truncatedContent =
            message.content.length > MAX_MESSAGE_LENGTH
              ? message.content.slice(0, MAX_MESSAGE_LENGTH) + '...(内容已截断)'
              : message.content;

          // 🔧 处理图片：不在localStorage中保存base64数据，只保存图片数量信息
          const processedMessage = { ...message, content: truncatedContent };
          if (message.images && message.images.length > 0) {
            // 只保存图片数量，不保存实际base64数据以避免localStorage溢出
            processedMessage.images = undefined; // 移除图片数据
            processedMessage.imageCount = message.images.length; // 记录图片数量
            processedMessage.hasImages = true; // 标记有图片
          }

          const fullMessage: AiMessage = {
            id: messageId,
            timestamp: Date.now(),
            ...processedMessage,
          };

          set((state) => ({
            aiChat: {
              ...state.aiChat,
              conversations: state.aiChat.conversations.map((conv) => {
                if (conv.id === currentConversationId) {
                  let messages = [...conv.messages, fullMessage];

                  // 限制单个对话的消息数量（最多保存100条消息）
                  const MAX_MESSAGES_PER_CONVERSATION = 100;
                  if (messages.length > MAX_MESSAGES_PER_CONVERSATION) {
                    messages = messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
                  }

                  const updatedConv = {
                    ...conv,
                    messages,
                    updatedAt: Date.now(),
                  };

                  // 自动生成标题（使用第一条用户消息的前20个字符）
                  if (conv.title === '新对话' && message.role === 'user') {
                    updatedConv.title =
                      message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '');
                    // 更新标题后同步到数据库
                    AiAutoSync.autoSyncConversation(updatedConv);
                  }

                  // 自动同步消息到数据库
                  AiAutoSync.autoSyncMessage(fullMessage, currentConversationId);

                  return updatedConv;
                }
                return conv;
              }),
            },
          }));
        },

        updateMessage: (messageId, updates) => {
          const state = get();
          const currentConversationId = state.aiChat.currentConversationId;

          if (!currentConversationId) return;

          set((state) => ({
            aiChat: {
              ...state.aiChat,
              conversations: state.aiChat.conversations.map((conv) => {
                if (conv.id === currentConversationId) {
                  return {
                    ...conv,
                    messages: conv.messages.map((msg) =>
                      msg.id === messageId ? { ...msg, ...updates } : msg
                    ),
                    updatedAt: Date.now(),
                  };
                }
                return conv;
              }),
            },
          }));
        },

        updateConversationTitle: async (conversationId, title) => {
          try {
            // 校验标题
            const trimmedTitle = title.trim();
            if (!trimmedTitle || trimmedTitle.length > 50) {
              throw new Error('标题长度必须在1-50字符之间');
            }

            // 更新数据库
            await AiDatabaseSync.updateConversationTitle(conversationId, trimmedTitle);

            // 更新本地状态
            set((state) => ({
              aiChat: {
                ...state.aiChat,
                conversations: state.aiChat.conversations.map((conv) =>
                  conv.id === conversationId
                    ? { ...conv, title: trimmedTitle, updatedAt: Date.now() }
                    : conv
                ),
              },
            }));
          } catch (error) {
            console.error('更新对话标题失败:', error);
            throw error;
          }
        },

        deleteConversation: (conversationId) => {
          // 从数据库删除对话
          AiDatabaseSync.deleteConversation(conversationId).catch(() => {
            // 忽略删除错误
          });

          set((state) => {
            const newConversations = state.aiChat.conversations.filter(
              (conv) => conv.id !== conversationId
            );
            const newCurrentId =
              state.aiChat.currentConversationId === conversationId
                ? newConversations.length > 0
                  ? newConversations[0].id
                  : null
                : state.aiChat.currentConversationId;

            return {
              aiChat: {
                ...state.aiChat,
                conversations: newConversations,
                currentConversationId: newCurrentId,
              },
            };
          });
        },

        clearAllConversations: () => {
          set((state) => ({
            aiChat: {
              ...state.aiChat,
              conversations: [],
              currentConversationId: null,
            },
          }));
        },

        setAiChatLoading: (loading) => {
          set((state) => ({
            aiChat: {
              ...state.aiChat,
              isLoading: loading,
            },
          }));
        },

        setAiChatLoadingConversation: (loading) => {
          set((state) => ({
            aiChat: {
              ...state.aiChat,
              isLoadingConversation: loading,
            },
          }));
        },

        setAiChatError: (error) => {
          set((state) => ({
            aiChat: {
              ...state.aiChat,
              error,
            },
          }));
        },

        // AI 智能体 Actions
        setCurrentAgent: (agentId) => {
          set((state) => ({
            aiConfig: {
              ...state.aiConfig,
              currentAgentId: agentId,
            },
          }));

          // 异步同步到数据库
          if (agentId) {
            AiConfigSync.setCurrentAiAgent(agentId).catch((error) => {
              console.error('设置当前AI智能体失败', error);
            });
          }
        },

        addAgent: (agent) => {
          const newAgent: AiAgent = {
            ...agent,
            id: generateAgentId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            aiConfig: {
              ...state.aiConfig,
              agents: [...(state.aiConfig.agents || []), newAgent],
            },
          }));

          // 异步同步到数据库
          AiConfigSync.saveAiAgent(newAgent).catch((error) => {
            console.error('保存AI智能体到数据库失败', error);
          });
        },

        updateAgent: (agentId, updates) => {
          set((state) => {
            const updatedAgents = (state.aiConfig.agents || []).map((agent) => {
              if (agent.id === agentId) {
                const updatedAgent = { ...agent, ...updates, updatedAt: Date.now() };

                // 异步同步到数据库
                AiConfigSync.saveAiAgent(updatedAgent).catch((error) => {
                  console.error('更新AI智能体到数据库失败', error);
                });

                return updatedAgent;
              }
              return agent;
            });

            return {
              aiConfig: {
                ...state.aiConfig,
                agents: updatedAgents,
              },
            };
          });
        },

        deleteAgent: (agentId) => {
          set((state) => {
            const agents = state.aiConfig.agents || [];

            // 如果删除的是当前选中的智能体，清空当前智能体ID
            const newCurrentAgentId =
              state.aiConfig.currentAgentId === agentId ? undefined : state.aiConfig.currentAgentId;

            return {
              aiConfig: {
                ...state.aiConfig,
                agents: agents.filter((agent) => agent.id !== agentId),
                currentAgentId: newCurrentAgentId,
              },
            };
          });

          // 异步从数据库删除
          AiConfigSync.deleteAiAgent(agentId).catch((error) => {
            console.error('从数据库删除AI智能体失败', error);
          });
        },

        // 知识库 Actions
        setLastUsedKnowledgeBaseId: (id) => {
          set({ lastUsedKnowledgeBaseId: id });
        },

        cleanupOldConversations: (daysToKeep = 30) => {
          const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

          set((state) => {
            const filteredConversations = state.aiChat.conversations.filter(
              (conv) => conv.updatedAt > cutoffTime
            );

            // 如果当前对话被删除，清除currentConversationId
            const currentConvExists = filteredConversations.some(
              (conv) => conv.id === state.aiChat.currentConversationId
            );

            return {
              aiChat: {
                ...state.aiChat,
                conversations: filteredConversations,
                currentConversationId: currentConvExists
                  ? state.aiChat.currentConversationId
                  : null,
              },
            };
          });
        },

        initializeApp: async () => {
          try {
            // 批量状态更新- 一次性更新所有初始状态，减少渲染
            const { theme, currentModule } = get();
            const initialItem: NavigationItem = {
              moduleId: currentModule,
              timestamp: Date.now(),
            };

            // 应用主题到DOM
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.setAttribute('data-theme', 'light');
            }

            // 批量更新状态，只触发一次渲染
            set({
              isLoading: false, // 立即设为false，显示界面
              navigationHistory: [initialItem],
              navigationIndex: 0,
            });

            // 使用微任务队列延迟非关键初始化，避免阻塞渲染
            queueMicrotask(async () => {
              try {
                // 并行启动数据库和AI配置加载
                const [databasePromise] = await Promise.allSettled([
                  (async () => {
                    const { DatabaseInitializer } = await import('@/services/database/initializer');
                    return DatabaseInitializer.ensureInitialized();
                  })(),
                ]);

                if (databasePromise.status === 'rejected') {
                  console.warn('Database initialization failed:', databasePromise.reason);
                }

                // 并行执行AI配置相关任务
                await Promise.allSettled([
                  get().migrateAiConfigIfNeeded(),
                  get().loadAiConfigFromDatabase(),
                ]);

                // 后台异步任务，不影响用户体验
                queueMicrotask(() => {
                  get()
                    .loadConversationsFromDatabase()
                    .catch(() => {});
                });

                // 清理任务放到更后面执行
                setTimeout(() => {
                  AiDatabaseSync.cleanupOldConversations(30).catch(() => {});
                  get().cleanupOldConversations(30);
                }, 5000); // 5秒后执行清理任务
              } catch (error) {
                console.error('初始化AI配置失败:', error);
              }
            });
          } catch (error) {
            console.error('应用初始化失败', error);
            set({ isLoading: false });
          }
        },

        loadConversationsFromDatabase: async () => {
          try {
            // 从数据库加载对话列表（最多50个）
            const dbConversations = await AiDatabaseSync.loadConversations(50);

            // 合并数据库对话和localStorage对话，去重
            const state = get();
            const localConversations = state.aiChat.conversations;
            const conversationMap = new Map<string, AiConversation>();

            // 优先使用数据库中的对话（更完整的数据）
            dbConversations.forEach((conv) => {
              conversationMap.set(conv.id, conv);
            });

            // 添加本地特有的对话
            localConversations.forEach((conv) => {
              if (!conversationMap.has(conv.id)) {
                conversationMap.set(conv.id, conv);
              }
            });

            // 按更新时间排序
            const mergedConversations = Array.from(conversationMap.values()).sort(
              (a, b) => b.updatedAt - a.updatedAt
            );

            set((state) => ({
              aiChat: {
                ...state.aiChat,
                conversations: mergedConversations,
              },
            }));
          } catch (error) {
            console.error('从数据库加载对话失败:', error);
          }
        },

        // AI配置数据迁移方法
        migrateAiConfigIfNeeded: async () => {
          try {
            // 检查是否需要数据迁移
            const needsMigration = await AiConfigSync.needsMigration();

            if (needsMigration) {
              const currentState = get();

              // 从localStorage迁移AI配置到数据库
              if (currentState.aiConfig) {
                await AiConfigSync.migrateFromLocalStorage(currentState.aiConfig);
              }
            }
          } catch (error) {
            console.error('AI配置数据迁移失败:', error);
          }
        },

        // 从数据库加载AI配置
        loadAiConfigFromDatabase: async () => {
          try {
            // 从数据库加载完整AI配置
            const dbConfig = await AiConfigSync.loadFullAiConfig();

            // 构建新的AI配置对象
            const newAiConfig = {
              ...get().aiConfig,
              ...dbConfig.providers,
              currentProvider: dbConfig.currentProvider || get().aiConfig.currentProvider,
              agents: dbConfig.agents.length > 0 ? dbConfig.agents : get().aiConfig.agents || [],
              currentAgentId: dbConfig.currentAgentId || get().aiConfig.currentAgentId,
            };

            // 更新store状态（但不触发数据库同步，避免循环）
            set((_state) => ({
              aiConfig: newAiConfig,
            }));
          } catch (error) {
            console.error('从数据库加载AI配置失败:', error);
          }
        },
      }),
      {
        name: 'app-store',
        // 只持久化必要的状态
        partialize: (state) => ({
          theme: state.theme,
          gradientTheme: state.gradientTheme,
          noiseLevel: state.noiseLevel,
          gradientAngle: state.gradientAngle,
          blendMode: state.blendMode,
          sidebarOpen: state.sidebarOpen,
          // currentModule: state.currentModule, // 不持久化当前模块，每次启动都显示主页
          aiConfig: state.aiConfig,
          // rightPanelOpen: state.rightPanelOpen, // 不持久化右侧栏状态，每次启动都默认折叠
          // 知识库相关持久化
          lastUsedKnowledgeBaseId: state.lastUsedKnowledgeBaseId,
          // 添加AI对话历史持久化
          aiChat: {
            conversations: state.aiChat.conversations,
            currentConversationId: state.aiChat.currentConversationId,
            // 不持久化加载和错误状态
          },
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // 强制设置默认模块为标签页
            state.currentModule = 'home';

            if (state.aiConfig) {
              // 确保 agents 数组存在，但不填充内置智能体
              if (!state.aiConfig.agents) {
                state.aiConfig.agents = [];
              }
              // 清空旧的内置智能体引用
              if (
                state.aiConfig.currentAgentId &&
                ['general', 'coder', 'writer', 'researcher'].includes(state.aiConfig.currentAgentId)
              ) {
                state.aiConfig.currentAgentId = undefined;
              }
            }
          }
        },
      }
    ),
    {
      name: 'app-store',
    }
  )
);
