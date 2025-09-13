import { useState, useCallback } from 'react';
import { sendAiMessageStream } from '@/utils/aiUtils';
import { AiMessage } from '@/types/aiConfig';
import { useAppStore } from '@/stores';

export const useMessageStreaming = () => {
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const { aiConfig, addMessage, setAiChatError } = useAppStore();

  const sendMessage = useCallback(async (
    content: string, 
    images?: string[],
    contextData?: any[]
  ) => {
    if (!content.trim() && (!images || images.length === 0)) return;

    const currentProvider = aiConfig.currentProvider;
    const currentConfig = aiConfig[currentProvider];

    if (!currentConfig.enabled || !currentConfig.apiKey) {
      setAiChatError('AI服务未配置或未启用');
      return;
    }

    try {
      // 添加用户消息
      const userMessage: Omit<AiMessage, 'id' | 'timestamp'> = {
        role: 'user',
        content,
        images: images && images.length > 0 ? images : undefined
      };
      addMessage(userMessage);

      // 开始流式响应
      setIsStreaming(true);
      setStreamingResponse('');
      setAiChatError(null);

      // 构建完整的上下文消息
      const systemPrompt = contextData && contextData.length > 0 
        ? `以下是用户提到的上下文信息：\n${contextData.map(ctx => `${ctx.type}: ${ctx.content}`).join('\n')}\n\n请基于这些上下文信息回答用户的问题。`
        : '';

      const fullContent = systemPrompt ? `${systemPrompt}\n\n${content}` : content;

      // 发送流式消息
      await sendAiMessageStream(
        currentProvider,
        currentConfig,
        fullContent,
        images,
        [], // previousMessages
        (chunk: string) => {
          setStreamingResponse(prev => prev + chunk);
        }
      );

      // 流式响应完成，添加助手消息
      if (streamingResponse.trim()) {
        const assistantMessage: Omit<AiMessage, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: streamingResponse.trim()
        };
        addMessage(assistantMessage);
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      setAiChatError(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setIsStreaming(false);
      setStreamingResponse('');
    }
  }, [aiConfig, addMessage, setAiChatError, streamingResponse]);

  return {
    streamingResponse,
    isStreaming,
    sendMessage
  };
};