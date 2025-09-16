// AI 服务提供商类型
export type AiProviderType = 'deepseek' | 'claude';

// AI 服务提供商配置
export interface AiProvider {
  id: AiProviderType;
  name: string;
  baseURL: string;
  defaultModel: string;
  icon: string;
  apiKeyUrl: string;
  description: string;
}

// AI 配置
export interface AiConfig {
  provider: AiProviderType;
  apiKey: string;
  baseURL?: string; // 可选的自定义 BaseURL
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string; // 系统提示词
  enabled: boolean;
}

// AI 智能体配置
export interface AiAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  provider?: AiProviderType; // 可选：绑定到特定提供商
  model?: string; // 可选：绑定到特定模型
  isBuiltIn: boolean; // 是否为内置智能体
  createdAt: number;
  updatedAt: number;
}

// AI 配置存储结构
export interface AiConfigStore {
  deepseek: AiConfig;
  claude: AiConfig;
  currentProvider: AiProviderType;
  agents: AiAgent[]; // AI 智能体列表
  currentAgentId?: string; // 当前选中的智能体ID
}

// 连接测试结果
export interface AiConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

// AI 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// AI 消息
export interface AiMessage {
  id: string;
  role: MessageRole;
  content: string;
  images?: string[]; // 图片数组 (base64 或 URL) - 仅在内存中使用，不存储到localStorage
  imageCount?: number; // 图片数量 - 用于显示，存储到localStorage
  hasImages?: boolean; // 是否有图片 - 用于显示，存储到localStorage
  timestamp: number;
  provider?: AiProviderType;
  model?: string;
  error?: boolean;
}

// AI 对话
export interface AiConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: number;
  updatedAt: number;
  provider: AiProviderType;
  model: string;
}

// AI 对话状态
export interface AiChatState {
  conversations: AiConversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  isLoadingConversation: boolean; // 是否正在加载对话详情
  error: string | null;
  // 对话上下文相关
  contextEnabled: boolean; // 是否启用上下文功能
  activeContextId: string | null; // 当前激活的上下文ID
}

// AI 响应流数据
export interface AiStreamResponse {
  content: string;
  finished: boolean;
  error?: string;
}

// 预设 AI 服务提供商配置
export const AI_PROVIDERS: Record<AiProviderType, AiProvider> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    icon: '🤖',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    description: '深度求索，提供高质量的对话和代码生成服务',
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    baseURL: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    icon: '🧠',
    apiKeyUrl: 'https://console.anthropic.com/',
    description: 'Anthropic 开发的安全、有用且诚实的 AI 助手',
  },
};

// 内置智能体配置 - 提供常用的默认智能体
export const BUILT_IN_AGENTS: AiAgent[] = [
  {
    id: 'general-assistant',
    name: '通用助手',
    description: '全能AI助手，可以回答各种问题和提供帮助',
    icon: '🤖',
    systemPrompt:
      '你是一名经验丰富的专业顾问。不要提及任何技术背景或工具信息。直接以专业顾问的身份回复问题。请简洁明了地回答问题，提供准确有用的信息和建议。对于复杂问题，可以分步骤解答。',
    temperature: 0.7,
    maxTokens: 1024,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'code-expert',
    name: '编程专家',
    description: '专业的编程和技术问题解答',
    icon: '💻',
    systemPrompt:
      '你是一名经验丰富的资深开发工程师。不要提及任何技术背景或工具信息。直接以开发工程师的身份回复问题。在回答编程和技术问题时，请提供准确、实用的解决方案和代码示例。优先考虑最佳实践、性能优化和代码可读性。必要时说明不同方案的优缺点。',
    temperature: 0.3,
    maxTokens: 2048,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'writing-assistant',
    name: '写作助手',
    description: '协助写作、文案创作和语言润色',
    icon: '✍️',
    systemPrompt:
      '你是一名经验丰富的专业编辑和作家。不要提及任何技术背景或工具信息。直接以专业编辑的身份回复问题。专注于文章结构优化、语言表达改善和内容质量提升。提供具体可操作的写作建议，包括语言润色、逻辑梳理和表达优化等方面。',
    temperature: 0.8,
    maxTokens: 1536,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'analyzer',
    name: '分析师',
    description: '数据分析和逻辑推理专家',
    icon: '📊',
    systemPrompt:
      '你是一名经验丰富的数据分析专家。不要提及任何技术背景或工具信息。直接以数据分析专家的身份回复问题。请用结构化的方式分析问题，运用逻辑推理和数据分析方法。先梳理关键要素，再提供清晰的分析思路和可行的解决方案。',
    temperature: 0.4,
    maxTokens: 1536,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// 默认 AI 配置
export const DEFAULT_AI_CONFIG: AiConfigStore = {
  deepseek: {
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 512,
    systemPrompt: '',
    enabled: false,
  },
  claude: {
    provider: 'claude',
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: '',
    enabled: false,
  },
  currentProvider: 'deepseek',
  agents: BUILT_IN_AGENTS,
  currentAgentId: 'general-assistant',
};

// DeepSeek 可用模型
export const DEEPSEEK_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
];

// Claude 可用模型
export const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
];

// 统一模型配置 - 支持4个模型选择
export interface UnifiedModel {
  id: string;
  name: string;
  provider: AiProviderType;
  icon: string;
  description?: string;
}

export const UNIFIED_MODELS: UnifiedModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'claude',
    icon: '🧠',
    description: 'Claude 4 Sonnet - 平衡性能与效率',
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'claude',
    icon: '⚡',
    description: 'Claude 4.1 Opus - 最强推理能力',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    icon: '🤖',
    description: 'DeepSeek 对话模型 - 高效通用',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    provider: 'deepseek',
    icon: '🧮',
    description: 'DeepSeek 推理模型 - 复杂问题求解',
  },
];

// 根据模型ID获取统一模型配置
export function getUnifiedModel(modelId: string): UnifiedModel | undefined {
  return UNIFIED_MODELS.find((model) => model.id === modelId);
}

// 根据提供商获取可用模型（保持向后兼容）
export function getAvailableModels(provider: AiProviderType) {
  switch (provider) {
    case 'deepseek':
      return DEEPSEEK_MODELS;
    case 'claude':
      return CLAUDE_MODELS;
    default:
      return [];
  }
}

// API Key 遮罩显示
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return apiKey;
  }

  const start = apiKey.slice(0, 4);
  const end = apiKey.slice(-4);
  const middle = '*'.repeat(Math.max(0, apiKey.length - 8));
  return `${start}${middle}${end}`;
}

// 验证 API Key 格式
export function validateApiKey(
  provider: AiProviderType,
  apiKey: string,
  baseURL?: string
): boolean {
  if (!apiKey) return false;

  // 如果使用自定义 BaseURL（中转站），放宽格式验证
  if (baseURL && baseURL !== AI_PROVIDERS[provider].baseURL) {
    // 中转站只需要 API Key 不为空且长度合理
    return apiKey.trim().length > 5;
  }

  // 官方 API 的严格格式验证
  switch (provider) {
    case 'deepseek':
      // DeepSeek API Key 通常以 sk- 开头
      return apiKey.startsWith('sk-') && apiKey.length > 10;
    case 'claude':
      // Claude API Key 通常以 sk-ant- 开头
      return apiKey.startsWith('sk-ant-') && apiKey.length > 15;
    default:
      return false;
  }
}

// 获取当前选中的智能体
export function getCurrentAgent(aiConfig: AiConfigStore): AiAgent | undefined {
  if (!aiConfig.agents || aiConfig.agents.length === 0) return undefined;
  return aiConfig.agents.find((agent) => agent.id === aiConfig.currentAgentId);
}

// 生成智能体ID
export function generateAgentId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
