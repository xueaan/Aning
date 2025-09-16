// 对话上下文系统类型定义

// 上下文类型枚举
export type ContextType = 'task' | 'knowledge' | 'mixed';

// 上下文项类型
export type ContextItemType = 'task' | 'task_list' | 'knowledge_page' | 'search';

// 提及建议类型
export type SuggestionType = 'task' | 'shortcut' | 'page';

// 提及类型检测结果
export interface MentionDetection {
  start: number;
  end: number;
  query: string;
  fullMatch: string;
  type?: 'shortcut' | 'search';
}

// 上下文项目
export interface ContextItem {
  id: string;
  type: ContextItemType;
  title: string;
  content: string;
  source?: {
    module: 'taskbox' | 'knowledge';
    id: string | number;
  };
  metadata: ContextMetadata;
  addedAt: number;
  tokenCount?: number; // 预估的token数量
}

// 上下文元数据
export interface ContextMetadata {
  // 任务相关
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  project_id?: number;
  project_name?: string;

  // 知识库相关
  kb_name?: string;

  // 搜索相关
  source?: string;
  resultCount?: number;

  // 通用
  created_at?: string;
  updated_at?: string;
  preview?: string; // 内容预览（前100字符）
}

// 对话上下文
export interface DialogueContext {
  id: string;
  type: ContextType;
  items: ContextItem[];
  totalTokens: number;
  createdAt: number;
  conversationId?: string; // 关联的对话ID
}

// 提及建议
export interface MentionSuggestion {
  label: string; // 显示文本
  value: string; // 实际值 (@page:123, @task: 456等)
  icon: string; // 显示图标
  preview?: string; // 预览文本
  type: SuggestionType;
  metadata?: {
    // 知识库页面
    kb_name?: string;
    parent_title?: string;

    // 任务
    status?: string;
    priority?: string;
    project?: string;
    due_date?: string;

    // 通用
    score?: number; // 搜索相关性分数
    tokens?: number; // 预估token数
  };
}

// 建议分组
export interface SuggestionGroup {
  type: 'shortcuts' | 'tasks' | 'knowledge';
  title: string;
  items: MentionSuggestion[];
  icon?: string;
}

// 搜索建议的返回结果
export interface SuggestionGroups {
  groups: SuggestionGroup[];
  total: number;
  hasMore: boolean;
}

// 快捷提及配置
export interface ShortcutMention {
  trigger: string; // @今日任务
  value: string; // @tasks:today
  label: string; // 今日任务
  icon: string;
  description?: string;
  aliases?: string[]; // 别名
}

// 上下文加载状态
export interface ContextLoadingState {
  isLoading: boolean;
  loadingItems: Set<string>; // 正在加载的item IDs
  error?: string;
}

// 上下文操作结果
export interface ContextActionResult {
  success: boolean;
  item?: ContextItem;
  error?: string;
  message?: string;
}

// 上下文统计信息
export interface ContextStats {
  totalItems: number;
  knowledges: number;
  tasks: number;
  totalTokens: number;
  estimatedCost?: number; // API调用预估成本
}

// 上下文搜索选项
export interface ContextSearchOptions {
  query: string;
  type?: ContextItemType[];
  limit?: number;
  includeContent?: boolean;
  knowledgeBase?: string; // 限制在特定知识库
  taskProject?: number; // 限制在特定项目
}

// 上下文导出格式
export interface ContextExport {
  context: DialogueContext;
  exportedAt: number;
  format: 'json' | 'markdown' | 'text';
  includeContent: boolean;
}

// AI提示词构建配置
export interface PromptConfig {
  includeSystemPrompt: boolean;
  contextSummary: boolean;
  taskAnalysis: boolean;
  knowledgeQA: boolean;
  temperature?: number;
  maxTokens?: number;
}

// 上下文处理器接口
export interface ContextProcessor {
  type: ContextItemType;
  process(data: any): ContextItem;
  validate(item: ContextItem): boolean;
  format(item: ContextItem): string;
  estimateTokens(content: string): number;
}

// 快捷提及常量
export const SHORTCUT_MENTIONS: ShortcutMention[] = [
  {
    trigger: '@今日任务',
    value: '@tasks:today',
    label: '今日任务',
    icon: '📅',
    description: '显示今天到期的所有任务',
    aliases: ['@today', '@今天'],
  },
  {
    trigger: '@本周任务',
    value: '@tasks:week',
    label: '本周任务',
    icon: '📆',
    description: '显示本周内的任务',
    aliases: ['@week', '@本周'],
  },
  {
    trigger: '@待办任务',
    value: '@tasks:pending',
    label: '待办任务',
    icon: '⏳',
    description: '显示所有未完成的任务',
    aliases: ['@pending', '@待办'],
  },
  {
    trigger: '@高优先级',
    value: '@tasks:high',
    label: '高优先级任务',
    icon: '⚡',
    description: '显示高优先级和紧急任务',
    aliases: ['@high', '@urgent'],
  },
  {
    trigger: '@已完成',
    value: '@tasks:completed',
    label: '已完成任务',
    icon: '✅',
    description: '显示最近完成的任务',
    aliases: ['@completed', '@done'],
  },
];

// 正则表达式模式
export const MENTION_PATTERNS = {
  // @符号后跟可选的中文、英文、数字、冒号，修复：去掉$结尾匹配，支持@提及后还有其他内容
  MENTION_REGEX: /@([\u4e00-\u9fa5\w:]*)/g,
  // 完整的提及格式：@type:id 或 @快捷方式
  FULL_MENTION: /@(tasks?):([\w\-]+)|@([\u4e00-\u9fa5]+)/g,
  // 任务提及：@task:id 或 @tasks:filter
  TASK_MENTION: /@tasks?:([a-zA-Z0-9\-_]+)/,
};

// Token估算常量
export const TOKEN_ESTIMATES = {
  CHINESE_CHAR: 1.5, // 中文字符平均token数
  ENGLISH_WORD: 1.3, // 英文单词平均token数
  PUNCTUATION: 0.5, // 标点符号token数
  TASK_METADATA: 50, // 任务元数据固定token数
  PAGE_METADATA: 40, // 页面元数据固定token数
};

// 默认配置
export const DEFAULT_CONTEXT_CONFIG = {
  MAX_ITEMS: 10, // 最大上下文项目数
  MAX_TOKENS: 4000, // 最大token数（为模型留足空间）
  SEARCH_LIMIT: 20, // 搜索结果限制
  PREVIEW_LENGTH: 100, // 预览文本长度
  DEBOUNCE_MS: 300, // 搜索防抖延迟
  CACHE_TTL: 5 * 60 * 1000, // 缓存5分钟
};
