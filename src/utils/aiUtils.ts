import { AiProviderType, AiConfig, AiConnectionTestResult, AI_PROVIDERS } from '@/types/aiConfig';
import { invokeTauri } from '@/utils/tauriWrapper';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// AI 连接测试 - 使用 Tauri 后端避免 CORS
export async function testAiConnection(
  provider: AiProviderType,
  config: AiConfig
): Promise<AiConnectionTestResult> {
  try {
    const providerConfig = AI_PROVIDERS[provider];
    const baseURL = config.baseURL || providerConfig.baseURL;

    const testRequest = {
      provider,
      base_url: baseURL,
      api_key: config.apiKey,
      model: config.model || (provider === 'claude' ? 'claude-sonnet-4-20250514' : 'deepseek-chat'),
    };

    const result = await invokeTauri<AiConnectionTestResult>('test_ai_connection', {
      request: testRequest,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      message: `测试失败: ${error}`,
      latency: undefined,
    };
  }
}

// 获取 AI 提供商的状态
export function getAiProviderStatus(config: AiConfig): 'ready' | 'partial' | 'disabled' {
  if (!config.enabled) {
    return 'disabled';
  }

  if (config.apiKey && config.model) {
    return 'ready';
  }

  return 'partial';
}

// 格式化 AI 配置显示信息
export function formatAiConfig(provider: AiProviderType, config: AiConfig): string {
  const providerConfig = AI_PROVIDERS[provider];
  const status = getAiProviderStatus(config);

  if (status === 'disabled') {
    return '未启用';
  }

  if (status === 'partial') {
    return '配置不完整';
  }

  return `${providerConfig.name} · ${config.model} · 已就绪`;
}

// 验证整个 AI 配置
export function validateAiConfig(config: AiConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('API Key 不能为空');
  }

  if (!config.model) {
    errors.push('必须选择一个模型');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature 值必须在 0-2 之间');
  }

  if (config.maxTokens < 1 || config.maxTokens > 4096) {
    errors.push('Max Tokens 值必须在 1-4096 之间');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 生成 AI 请求的通用配置
export function buildAiRequestConfig(
  provider: AiProviderType,
  config: AiConfig,
  message: string
): { url: string; headers: Record<string, string>; body: any } {
  const providerConfig = AI_PROVIDERS[provider];
  const baseURL = config.baseURL || providerConfig.baseURL;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Note-App/1.0',
  };

  let url: string;
  let body: any;

  if (provider === 'deepseek') {
    url = `${baseURL}/chat/completions`;
    headers['Authorization'] = `Bearer ${config.apiKey}`;

    body = {
      model: config.model,
      messages: [{ role: 'user', content: message }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    };
  } else if (provider === 'claude') {
    // 中转站和官方都使用相同的 Claude API 格式
    url = `${baseURL}/v1/messages`;
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';

    body = {
      model: config.model,
      messages: [{ role: 'user', content: message }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };
  } else {
    throw new Error(`不支持的 AI 提供商: ${provider}`);
  }

  return { url, headers, body };
}

// 错误处理辅助函数
export function parseAiError(_provider: AiProviderType, error: any): string {
  // 暂时未使用，保留接口完整性
  if (typeof error === 'string') {
    return error;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return '未知错误';
}

// AI 聊天服务调用
export async function sendAiMessage(
  provider: AiProviderType,
  config: AiConfig,
  message: string,
  previousMessages: { role: string; content: string }[] = []
): Promise<string> {
  // const startTime = Date.now(); // 暂时未使用

  try {
    const providerConfig = AI_PROVIDERS[provider];
    const baseURL = config.baseURL || providerConfig.baseURL;

    // 构建完整的消息历史，包括新消息
    const messages = [...previousMessages, { role: 'user', content: message }];

    const chatRequest = {
      provider,
      base_url: baseURL,
      api_key: config.apiKey,
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };

    // 根据 max_tokens 动态调整超时时间
    const baseTimeout = 30000; // 基础30秒
    const tokenTimeout = Math.max(config.maxTokens * 50, 15000); // 每个token增加50ms，最少15秒
    const dynamicTimeout = Math.min(baseTimeout + tokenTimeout, 90000); // 最多90秒

    const requestPromise = invokeTauri<{ success: boolean; message?: string; content?: string }>(
      'send_ai_chat',
      {
        request: chatRequest,
      }
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `AI请求超时（${Math.round(dynamicTimeout / 1000)}秒），请尝试减少Max Tokens或检查网络连接`
          )
        );
      }, dynamicTimeout);
    });

    const result = await Promise.race([requestPromise, timeoutPromise]);

    if (result.success && result.content) {
      return result.content;
    } else {
      throw new Error(result.message || '发送消息失败');
    }
  } catch (error) {
    throw new Error(`AI 服务错误: ${parseAiError(provider, error)}`);
  }
}

// AI 聊天服务（真正的流式版本）
// 扩展消息接口支持图片
interface AiStreamMessage {
  role: string;
  content: string;
  images?: string[];
}

// AI 服务调用包装函数，兼容老的接口
export async function callAiService(
  provider: AiProviderType,
  config: AiConfig,
  message: string
): Promise<{ success: boolean; content?: string; message?: string }> {
  try {
    const content = await sendAiMessage(provider, config, message);
    return {
      success: true,
      content,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendAiMessageStream(
  provider: AiProviderType,
  config: AiConfig,
  message: string,
  images: string[] = [],
  previousMessages: AiStreamMessage[] = [],
  onChunk?: (chunk: string) => void,
  onComplete?: (fullResponse: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let fullResponse = '';
  let unlisten: UnlistenFn | null = null;

  try {
    // 监听流式响应事件
    unlisten = await listen<{
      request_id: string;
      content: string;
      finished: boolean;
      error?: string;
    }>('ai-stream-chunk', (event) => {
      const chunk = event.payload;

      // 只处理本次请求的响应
      if (chunk.request_id !== requestId) {
        return;
      }

      if (chunk.error) {
        onError?.(chunk.error);
        return;
      }

      if (chunk.finished) {
        onComplete?.(fullResponse);
        unlisten?.(); // 清理事件监听
        return;
      }

      // 处理内容chunk
      if (chunk.content) {
        fullResponse += chunk.content;
        onChunk?.(chunk.content);
      }
    });

    // 准备消息历史，包括新消息（支持图片）
    const userMessage: AiStreamMessage = { role: 'user', content: message };

    // 如果有图片，添加到消息中
    if (images.length > 0) {
      userMessage.images = images;
    }

    const messages = [...previousMessages, userMessage];

    // 发起流式请求
    const request = {
      request_id: requestId,
      provider,
      base_url: config.baseURL || AI_PROVIDERS[provider].baseURL,
      api_key: config.apiKey,
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };

    await invokeTauri('send_ai_chat_stream', { request });
  } catch (error) {
    console.error('AI streaming error:', error);
    unlisten?.();
    onError?.(parseAiError(provider, error));
  }
}
