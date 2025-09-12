import { invoke } from '@tauri-apps/api/core';
import { AiConversation, AiMessage, AiProviderType } from '@/types/aiConfig';

// Tauri命令的请求类型
interface SaveConversationRequest {
  id: string;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
}
interface SaveMessageRequest {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  provider?: string;
  model?: string;
  error: boolean;
  timestamp: number;
  created_at: string;
}
interface ConversationResponse {
  conversations: Array<{
    id: string;
    title: string;
    provider: string;
    model: string;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}
interface ConversationDetailResponse {
  conversation: {
    id: string;
    title: string;
    provider: string;
    model: string;
    created_at: string;
    updated_at: string;
  };
  messages: Array<{
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    provider?: string;
    model?: string;
    error: boolean;
    timestamp: number;
    created_at: string;
  }>;
}

// 数据转换函数
function conversationToRequest(conversation: AiConversation): SaveConversationRequest {
  return {
    id: conversation.id,
    title: conversation.title,
    provider: conversation.provider,
    model: conversation.model,
    created_at: new Date(conversation.createdAt).toISOString(),
    updated_at: new Date(conversation.updatedAt).toISOString()
  };
}
function messageToRequest(message: AiMessage): SaveMessageRequest {
  return {
    id: message.id,
    conversation_id: '', // Should be set by caller
    role: message.role,
    content: message.content,
    provider: message.provider,
    model: message.model,
    error: message.error || false,
    timestamp: message.timestamp,
    created_at: new Date(message.timestamp).toISOString()
  };
}
function dbConversationToType(dbConv: ConversationDetailResponse['conversation']): AiConversation {
  return {
    id: dbConv.id,
    title: dbConv.title,
    messages: [], // 将单独加载
    createdAt: new Date(dbConv.created_at).getTime(),
    updatedAt: new Date(dbConv.updated_at).getTime(),
    provider: dbConv.provider as AiProviderType,
    model: dbConv.model
  };
}
function dbMessageToType(dbMsg: ConversationDetailResponse['messages'][0]): AiMessage {
  return {
    id: dbMsg.id,
    role: dbMsg.role as 'user' | 'assistant' | 'system',
    content: dbMsg.content,
    timestamp: dbMsg.timestamp,
    provider: dbMsg.provider as AiProviderType,
    model: dbMsg.model,
    error: dbMsg.error
  };
}

// AI对话数据库同步类
export class AiDatabaseSync {
  // 保存对话到数据库
  static async saveConversation(conversation: AiConversation): Promise<void> {
    const request = conversationToRequest(conversation);
    await invoke('save_ai_conversation', { request });
  }

  // 保存消息到数据库
  static async saveMessage(message: AiMessage, conversationId: string): Promise<void> {
    const request = {
      ...messageToRequest(message),
      conversation_id: conversationId // 正确设置conversation_id
    };
    await invoke('save_ai_message', { request });
  }

  // 批量同步对话和消息
  static async syncConversationWithMessages(conversation: AiConversation, messages: AiMessage[]): Promise<void> {
    const conversationRequest = conversationToRequest(conversation);
    const messageRequests = messages.map(msg => ({
      ...messageToRequest(msg),
      conversation_id: conversation.id
    }));

    await invoke('sync_ai_conversation_with_messages', {
      conversation: conversationRequest,
      messages: messageRequests
    });
  }

  // 从数据库加载对话列表
  static async loadConversations(limit?: number): Promise<AiConversation[]> {
    const response = await invoke<ConversationResponse>('get_ai_conversations', { limit });
    return response.conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messages: [], // 消息需要单独加载
      createdAt: new Date(conv.created_at).getTime(),
      updatedAt: new Date(conv.updated_at).getTime(),
      provider: conv.provider as AiProviderType,
      model: conv.model
    }));
  }

  // 从数据库加载完整对话详情（包含消息）
  static async loadConversationDetail(conversationId: string): Promise<AiConversation | null> {
    const response = await invoke<ConversationDetailResponse | null>('get_ai_conversation_detail', 
      { conversationId });

    if (!response) return null;

    const conversation = dbConversationToType(response.conversation);
    conversation.messages = response.messages.map(dbMessageToType);

    return conversation;
  }

  // 删除对话
  static async deleteConversation(conversationId: string): Promise<void> {
    await invoke('delete_ai_conversation', { conversationId });
  }

  // 更新对话标题
  static async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await invoke('update_ai_conversation_title', { conversationId, title });
  }

  // 搜索对话
  static async searchConversations(query: string, limit?: number): Promise<AiConversation[]> {
    const response = await invoke<ConversationResponse>('search_ai_conversations', { 
      query, 
      limit 
    });
    return response.conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messages: [],
      createdAt: new Date(conv.created_at).getTime(),
      updatedAt: new Date(conv.updated_at).getTime(),
      provider: conv.provider as AiProviderType,
      model: conv.model
    }));
  }

  // 清理旧对话
  static async cleanupOldConversations(daysToKeep?: number): Promise<number> {
    return await invoke<number>('cleanup_old_ai_conversations', { daysToKeep });
  }
}

// 自动同步管理器
export class AiAutoSync {
  private static syncQueue: Array<() => Promise<void>> = [];
  private static isProcessing = false;
  private static syncTimeout: NodeJS.Timeout | null = null;

  // 队列化自动同步任务
  static queueSync(syncFunction: () => Promise<void>) {
    this.syncQueue.push(syncFunction);
    this.processSyncQueue();
  }

  // 处理同步队列
  private static async processSyncQueue() {
    if (this.isProcessing) return;

    // 延迟处理，避免频繁同步
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(async () => {
      this.isProcessing = true;
      
      while (this.syncQueue.length > 0) {
        const syncFunction = this.syncQueue.shift();
        if (syncFunction) {
          try {
            await syncFunction();
          } catch (error) {
            console.error('Auto sync failed:', error);
          }
        }
      }

      this.isProcessing = false;
    }, 1000); // 1秒延迟
  }

  // 自动同步对话
  static autoSyncConversation(conversation: AiConversation) {
    this.queueSync(() => AiDatabaseSync.saveConversation(conversation));
  }

  // 自动同步消息
  static autoSyncMessage(message: AiMessage, conversationId: string) {
    this.queueSync(() => AiDatabaseSync.saveMessage(message, conversationId));
  }
}






