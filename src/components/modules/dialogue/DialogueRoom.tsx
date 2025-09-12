import React, { useState, useRef, useEffect } from 'react';
import { Plus, Clock, ChevronDown, Trash2, Bot } from 'lucide-react';
import { useAppStore } from '@/stores';
import { useResponsive } from '@/hooks/useResponsive';
import { sendAiMessageStream } from '@/utils/aiUtils';
import { AiMessage, AI_PROVIDERS, UNIFIED_MODELS, UnifiedModel, getUnifiedModel, getCurrentAgent, AiAgent } from '@/types/aiConfig';
import { AiDatabaseSync } from '@/utils/aiDatabaseSync';
import { TypewriterMessage } from '@/components/common/TypewriterMessage';
import { ImageUpload } from '@/components/common/ImageUpload';
import { SmartInput } from '@/components/dialogue/SmartInput';
import { useDialogueContextStore } from '@/stores';
import { getIconComponent, convertEmojiToIcon } from '@/constants/commonIcons';

export const DialogueRoom: React.FC = () => {
  const [message, setMessage] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  // 响应式Hook
  const { isMobile, isTablet } = useResponsive();

  const {
    aiConfig,
    aiChat,
    createConversation,
    addMessage,
    deleteConversation,
    setCurrentConversation,
    setAiChatError,
    setCurrentAiProvider,
    updateAiConfig,
    setSettingsModalOpen,
    setCurrentAgent
  } = useAppStore();

  // Context dialogue store
  const {
    activeContexts,
    // stats,
    clearAllContexts,
    // actives
  } = useDialogueContextStore();

  const currentProvider = aiConfig.currentProvider;
  const currentConfig = aiConfig[currentProvider];
  const currentConversation = aiChat.conversations.find(c => c.id === aiChat.currentConversationId);
  const currentAgent = getCurrentAgent(aiConfig);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingResponse]);

  // 点击外部关闭弹窗
  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (showConversationHistory && !target.closest('[data-conversation-history]')) {
      setShowConversationHistory(false);
    }
    if (showModelDropdown && modelDropdownRef.current && !modelDropdownRef.current.contains(target as Node)) {
      setShowModelDropdown(false);
    }
    if (showAgentDropdown && agentDropdownRef.current && !agentDropdownRef.current.contains(target as Node)) {
      setShowAgentDropdown(false);
    }
  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, [showConversationHistory, showModelDropdown, showAgentDropdown]);

  // 全局剪贴板监听 - 处理Ctrl+V图片粘贴
  useEffect(() => {
  const handleGlobalPaste = async (event: KeyboardEvent) => {
    // 检查是否是Ctrl+V或Cmd+V，并且焦点在输入框内
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      // 检查焦点是否在textarea内
      const activeElement = document.activeElement;
      const isInTextarea = activeElement?.tagName === 'TEXTAREA';

      if (!isInTextarea) return; // 只有在输入框内才处理

      try {
        // 读取剪贴板内容
        const clipboardItems = await navigator.clipboard.read();

        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              // 获取图片blob并转换为base64
              const blob = await clipboardItem.getType(type);
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                // 直接添加到选中图片列表，不打开上传界面
                setSelectedImages(prev => [...prev, base64]);
              };
              reader.readAsDataURL(blob);

              // 阻止默认粘贴行为
              event.preventDefault();
              break;
            }
          }
        }
      } catch (error) {
        // 如果clipboard API不可用，让SmartInput处理
        console.log('剪贴板访问受限，使用输入框粘贴处理');
      }
    }
  };

  // 添加全局键盘监听
  document.addEventListener('keydown', handleGlobalPaste);
  return () => document.removeEventListener('keydown', handleGlobalPaste);
}, []);

  const handleSend = async () => {
  if ((!message.trim() && selectedImages.length === 0) || !currentConfig.enabled) return;

  const userMessage = message.trim();
  const images = [...selectedImages];

  setMessage('');
  setSelectedImages([]);
  setShowImageUpload(false);
  setAiChatError(null);

  // 如果没有当前对话，创建新对话
  let conversationId = aiChat.currentConversationId;
  if (!conversationId) {
    conversationId = createConversation();
  }

  // 保存当前对话ID，防止切换对话时回复到错误的对话
  const targetConversationId = conversationId;

  // 添加用户消息
  addMessage({
    role: 'user',
    content: userMessage,
    images: images.length > 0 ? images : undefined,
    provider: currentProvider,
    model: currentConfig.model
  });

  // 准备消息历史（转换格式，包含图片）
  const messages = currentConversation?.messages || [];
  const messageHistory = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
    images: msg.images
  }));

  // 准备上下文信息
  const context = Array.from(activeContexts.values());
  let contextPrompt = '';

  if (context.length > 0) {
    contextPrompt = '\n\n--- 上下文信�?---\n';
    context.forEach((context, index) => {
      contextPrompt += `\n${index + 1}. [${context.type}] ${context.title}\n`;
      if (context.content) {
        // 限制每个上下文的内容长度
        const maxLength = 1000;
        const truncatedContent = context.content.length > maxLength
          ? context.content.substring(0, maxLength) + '...'
          : context.content;
        contextPrompt += `内容：${truncatedContent}\n`;
      }
      if (context.metadata.kb_name) {
        contextPrompt += `知识库：${context.metadata.kb_name}\n`;
      }
      if (context.metadata.status) {
        contextPrompt += `状态：${context.metadata.status}\n`;
      }
      if (context.metadata.priority) {
        contextPrompt += `优先级：${context.metadata.priority}\n`;
      }
      contextPrompt += '\n';
    });
    contextPrompt += '--- 上下文信息结束 ---\n\n';
  }

  // 如果有上下文，将其添加到用户消息中
  const finalUserMessage = contextPrompt + userMessage;

  setIsStreaming(true);
  setStreamingResponse('');

  try {
    let fullResponse = '';

    await sendAiMessageStream(
      currentProvider,
      currentConfig,
      finalUserMessage,
      images,
      messageHistory,
      (chunk: string) => {
        // 只有当前对话没有切换时才更新流式响应
        const currentState = useAppStore.getState();
        if (currentState.aiChat.currentConversationId === targetConversationId) {
          fullResponse += chunk;
          setStreamingResponse(fullResponse);
        }
      },
      (complete: string) => {
        // 确保回复添加到正确的对话
        const currentState = useAppStore.getState();
        if (currentState.aiChat.currentConversationId === targetConversationId) {
          // 完成时添加AI回复消息
          addMessage({
            role: 'assistant',
            content: complete,
            provider: currentProvider,
            model: currentConfig.model
          });
          setStreamingResponse('');
          setIsStreaming(false);
        } else {
          // 如果用户切换了对话，将回复添加到原始对话
          const store = useAppStore.getState();
          const updatedConversations = store.aiChat.conversations.map(conv => {
            if (conv.id === targetConversationId) {
              const newMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant' as const,
                content: complete,
                timestamp: Date.now(),
                provider: currentProvider,
                model: currentConfig.model
              };
              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                updatedAt: Date.now()
              };
            }
            return conv;
          });

          useAppStore.setState({
            aiChat: {
              ...store.aiChat,
              conversations: updatedConversations
            }
          });

          setStreamingResponse('');
          setIsStreaming(false);
        }
      },
      (error: string) => {
        // 确保错误消息添加到正确的对话中
        const currentState = useAppStore.getState();
        if (currentState.aiChat.currentConversationId === targetConversationId) {
          setAiChatError(error);
          addMessage({
            role: 'assistant',
            content: `错误: ${error}`,
            provider: currentProvider,
            model: currentConfig.model,
            error: true
          });
        } else {
          // 如果用户切换了对话，将错误消息添加到原始对话中
          const store = useAppStore.getState();
          const updatedConversations = store.aiChat.conversations.map(conv => {
            if (conv.id === targetConversationId) {
              const errorMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant' as const,
                content: `错误: ${error}`,
                timestamp: Date.now(),
                provider: currentProvider,
                model: currentConfig.model,
                error: true
              };
              return {
                ...conv,
                messages: [...conv.messages, errorMessage],
                updatedAt: Date.now()
              };
            }
            return conv;
          });

          useAppStore.setState({
            aiChat: {
              ...store.aiChat,
              conversations: updatedConversations
            }
          });
        }

        setStreamingResponse('');
        setIsStreaming(false);
      }
    );
  } catch (error) {
    setAiChatError(`发送失�? ${error}`);
    setIsStreaming(false);
    setStreamingResponse('');
  }
};

  const handleNewConversation = () => {
    createConversation();
  };

  // 获取当前选中的统一模型
  const getCurrentUnifiedModel = (): UnifiedModel | undefined => {
    return getUnifiedModel(currentConfig.model);
  };

// 处理智能体切换
const handleAgentSelect = (agent: AiAgent) => {
setCurrentAgent(agent.id);

// 如果智能体绑定了特定的提供商和模型，自动切换
if (agent.provider && agent.model) {
  const targetConfig = aiConfig[agent.provider];
  if (targetConfig?.enabled) {
    setCurrentAiProvider(agent.provider);
    updateAiConfig(agent.provider, {
      ...targetConfig,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      systemPrompt: agent.systemPrompt
    });
  }
} else {
      // 只更新当前提供商的配置
      updateAiConfig(currentProvider, {
        ...currentConfig,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        systemPrompt: agent.systemPrompt
      });
    }

  setShowAgentDropdown(false);
};

// 处理模型切换
const handleModelSelect = (model: UnifiedModel) => {
  // 检查目标提供商是否已启用
  const targetConfig = aiConfig[model.provider];
  if (!targetConfig?.enabled) {
    setAiChatError(`${AI_PROVIDERS[model.provider].name} 未配置，请先在设置中配置 API`);
    setShowModelDropdown(false);
    return;
  }

  // 切换提供商和模型
  setCurrentAiProvider(model.provider);
  updateAiConfig(model.provider, {
    ...targetConfig,
    model: model.id
  });

  setShowModelDropdown(false);
};

// 加载对话详情（包含消息）
const handleLoadConversationDetail = async (conversationId: string) => {
  try {
    const conversationDetail = await AiDatabaseSync.loadConversationDetail(conversationId);
    if (conversationDetail) {
      // 更新store中的对话数据
      const store = useAppStore.getState();
      const updatedConversations = store.aiChat.conversations.map(conv =>
        conv.id === conversationId ? conversationDetail : conv
      );

      // 如果对话不在当前列表中，添加它
      if (!store.aiChat.conversations.find(c => c.id === conversationId)) {
      updatedConversations.unshift(conversationDetail);
    }

    // 更新store
    useAppStore.setState({
      aiChat: {
        ...store.aiChat,
        conversations: updatedConversations,
        currentConversationId: conversationId
      }
    });
  } else {
    // 如果数据库中没有该对话，直接切换到现有对话
    setCurrentConversation(conversationId);
  }
} catch (error) {
  // 降级到本地切换
  setCurrentConversation(conversationId);
}
  };

const renderMessage = (msg: AiMessage) => {
  const isUser = msg.role === 'user';
  const isError = msg.error;

  return (
    <div key={msg.id} 
            className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-3`}>
      {/* 简化头像 */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser
          ? 'theme-bg-accent/10'
          : isError
            ? 'theme-bg-error/20'
            : 'theme-bg-secondary/80 backdrop-blur-sm'
          }`}>
          {isUser ? (
            <svg className="w-4 h-4 theme-text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 theme-text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          )}
        </div>
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''} ${isMobile
          ? 'max-w-[90%]'
          : isTablet
            ? 'max-w-[85%]'
            : 'max-w-[75%]'
        }`}>
        <div className={`inline-block p-2.5 rounded-xl transition-all duration-200 overflow-hidden ${isUser
            ? 'theme-bg-accent theme-text-on-accent ml-auto shadow-sm'
            : isError
              ? 'theme-text-error'
              : 'theme-text-primary'
            } ${!isUser ? 'feather-glass-deco' : ''}`}
        >
          {isUser ? (
            // 用户消息直接显示，支持图片
            <div className="space-y-2">
              {/* 显示图片（如果有） */}
              {msg.images && msg.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  {msg.images.map((image, idx) => (
                    <img key={idx} 
                      src={image}
                      alt={`上传的图片 ${idx + 1}`}
                      className="rounded-lg theme-border max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              )}
              {/* 显示图片占位符（当有图片但已被清理时） */}
              {msg.hasImages && (!msg.images || msg.images.length === 0) && (
                <div className="text-xs theme-text-on-accent/70 italic flex items-center gap-1">
                  <span>📷</span>
                  <span>包含 {msg.imageCount || 1} 张图片（已发送给AI）</span>
                </div>
              )}
              {/* 显示文本内容 */}
              {msg.content && (
                <div className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                  {msg.content}
                </div>
              )}
            </div>
          ) : (
          // AI消息使用TypewriterMessage组件，支持markdown渲染但禁用打字效果（因为已经是真正的流式）
          <TypewriterMessage 
            content={msg.content} 
            enableTypewriter={false} // 历史消息不使用打字效果
            isError={isError} 
            speed={25}
          />
            )}
        </div>
      </div>
    </div>
  );
  };

  // 如果AI配置未启用，显示配置提示
  if (!currentConfig.enabled) {
    return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 theme-bg-accent rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="theme-text-primary text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-medium theme-text-primary mb-2">AI 助手未配置</h3>
            <p className="text-sm theme-text-secondary mb-4">
              请先在设置中配置 AI 服务，然后开始使用智能助手功能
            </p>
            <button onClick={() => setSettingsModalOpen(true)}
            className="px-4 py-2 theme-bg-accent hover:theme-bg-accent-hover theme-text-on-accent rounded-lg transition-colors"
            >
            前往设置
          </button>
        </div>
      </div>
    </div>
    );
  }

  return (
  <div className="h-full flex flex-col w-full px-4 xl:px-6">
    {/* 顶部操作栏 - 与密码管理器风格一致 */}
    <div className="py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：对话标题 */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium theme-text-primary">对话室</h2>
            {currentConversation && (
              <div className="text-sm theme-text-secondary truncate max-w-xs">
                {currentConversation.title}
              </div>
            )}
        </div>
        <div className="flex items-center gap-2">
          {/* 清除上下文按钮*/}
          {Array.from(activeContexts.values()).length > 0 && (
            <button 
              onClick={clearAllContexts} 
              className="p-2 rounded-lg theme-text-secondary hover:theme-warning hover:theme-bg-secondary transition-colors relative"
                title={`清除 ${Array.from(activeContexts.values()).length} 个上下文`}
              >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="absolute -top-1 -right-1 theme-bg-warning theme-text-on-accent text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium" style={{ fontSize: '10px' }}>
            {Array.from(activeContexts.values()).length > 9 ? '9' : Array.from(activeContexts.values()).length}
          </span>
        </button>
            )}

        <button onClick={handleNewConversation}
            className="p-2 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary transition-colors"
            title="新对话"
            >
        <Plus size={16} />
      </button>

      <div className="relative" data-conversation-history>
        <button onClick={() => setShowConversationHistory(!showConversationHistory)}
            className="p-2 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary transition-colors relative"
            title="对话历史"
              >
        <Clock size={16} />
        {aiChat.conversations.length > 0 && (
          <span className="absolute -top-1 -right-1 theme-bg-accent theme-text-on-accent text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium" style={{ fontSize: '10px' }}>
            {aiChat.conversations.length > 9 ? '9' : aiChat.conversations.length}
          </span>
        )}
      </button>

      {showConversationHistory && (
        <div className="absolute top-full right-0 mt-2 rounded-xl shadow-lg z-50 min-w-[280px] max-h-[400px] overflow-y-auto feather-glass-dropdown">
          <div className="p-3 border-b theme-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium theme-text-primary">对话历史</h3>
              <span className="text-xs theme-text-secondary">{aiChat.conversations.length} 个对话</span>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {aiChat.conversations.length > 0 ? (
              aiChat.conversations.map((conv) => (
                <div key={conv.id}
            className={`group flex items-start gap-3 p-3 hover:theme-bg-secondary cursor-pointer transition-colors ${conv.id === aiChat.currentConversationId ? 'theme-bg-secondary border-l-2 theme-border-accent' : ''
                  }`}
            onClick={() => {
              handleLoadConversationDetail(conv.id);
              setShowConversationHistory(false);
            }}
                        >
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${conv.id === aiChat.currentConversationId ? 'theme-bg-accent' : 'bg-current opacity-30'
                }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium theme-text-primary truncate mb-1">
                {conv.title}
              </div>
              <div className="text-xs theme-text-secondary opacity-75">
                {conv.messages.length} 消息 · {new Date(conv.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <button onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
              className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:theme-bg-error/10 rounded theme-text-error hover:theme-text-error transition-all"
              title="删除对话"
            >
            <Trash2 size={16} />
          </button>
        </div>
      ))
            ) : (
              <div className="p-6 text-center theme-text-secondary text-sm">
                <div className="w-12 h-12 mx-auto mb-3 theme-bg-secondary rounded-full flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <p>还没有对话历史</p>
                <p className="text-xs mt-1">开始新对话后会显示在这里</p>
              </div>
            )}
      </div>
    </div>
              )}
  </div>

            {
  aiChat.currentConversationId && (
    <button onClick={() => deleteConversation(aiChat.currentConversationId!)}
            className="p-2 rounded-lg theme-text-secondary hover:theme-text-error hover:theme-bg-secondary transition-colors"
      title="删除当前对话"
          >
      <Trash2 size={16} />
    </button>
  )
  }
          </div>
        </div>
      </div>
      {/* 对话区域 - 防止横向溢出 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {currentConversation && currentConversation.messages.length > 0 ? (
          <div>
      {currentConversation.messages.map(renderMessage)}

      {/* AI思考动画 - 在开始回复前显示 */}
      {isStreaming && !streamingResponse && (
        <div className="flex gap-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 theme-bg-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 theme-text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          </div>
          <div className={`flex-1 ${isMobile ? 'max-w-[90%]' : isTablet ? 'max-w-[85%]' : 'max-w-[75%]'
            }`}>
            <div className="inline-block p-2.5 rounded-xl feather-glass-deco">
              <div className="flex items-center gap-2">
                {/* 思考中的动画点 */}
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 theme-bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 theme-bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 theme-bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs theme-text-secondary">正在思考..</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 流式响应 */}
      {isStreaming && streamingResponse && (
        <div className="flex gap-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 theme-bg-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 theme-text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          </div>
          <div className={`flex-1 ${isMobile ? 'max-w-[90%]' : isTablet ? 'max-w-[85%]' : 'max-w-[75%]'
            }`}>
            <div className="inline-block p-2.5 rounded-xl feather-glass-deco">
              {/* 使用TypewriterMessage组件支持markdown渲染，禁用打字效果（已经是真正的流式响应） */}
              <TypewriterMessage 
                content={streamingResponse} 
                enableTypewriter={false} // 真正的流式响应，不需要打字效果
                speed={25}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  ) : (
    /* 欢迎界面 */
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm">
        {/* 简洁头部 */}
        <div className="mx-auto mb-6">
          <div className="w-16 h-16 theme-bg-secondary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 theme-text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
        </div>
        <div className="space-y-3">
          <div className="theme-text-primary text-lg font-medium">
            欢迎来到对话室
          </div>
          <div className="text-sm theme-text-secondary">
            发送消息开始对话，探索更多可能性
          </div>
        </div>
      </div>
    </div>
  )}
      </div>
      {/* 错误提示 */}
      {
  aiChat.error && (
    <div className="mx-4 mb-2 p-3 theme-bg-error/20 border theme-border-error backdrop-blur-sm rounded-lg theme-text-error text-xs flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <span className="theme-text-error">⚠️</span>
        <span>{aiChat.error}</span>
      </div>
      <button onClick={() => setAiChatError(null)}
        className="ml-2 p-1 hover:theme-bg-error/10 rounded theme-text-error hover:theme-text-error transition-colors"
      >
        ×
      </button>
    </div>
  )
}

      {/* 输入区域 */}
      <div className="px-2 py-1">
  <div className="rounded-xl p-2 space-y-2 feather-glass-panel">
    {/* 智能输入框组件 */}
    <SmartInput value={message} onChange={setMessage}
    onSend={handleSend} disabled={isStreaming}
      placeholder={selectedImages.length > 0 ? "描述一下这些图片.." : "输入消息，使用 @ 添加知识库页面或任务到上下文..."} 
      showImageUpload={showImageUpload}
      onImageUploadToggle={() => setShowImageUpload(!showImageUpload)}
    />

    {/* 底部工具栏 */}
    <div className="flex items-center justify-between gap-3">
      {/* 左侧：智能体快捷按钮 */}
      <div className="flex items-center gap-2">
        {(aiConfig.agents || []).length > 0 ? (
          <div className="flex items-center gap-1">
            {(aiConfig.agents || []).slice(0, isMobile ? 3 : isTablet ? 4 : 6).map(agent => {
              const isSelected = currentAgent?.id === agent.id;
              return (
                <button key={agent.id} onClick={() => handleAgentSelect(agent)}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 relative group ${isSelected
                ? 'bg-blue-500 text-white font-bold shadow-2xl shadow-blue-500/50'
                : 'theme-bg-secondary/20 hover:theme-bg-secondary/40 theme-text-secondary hover:theme-text-primary hover:scale-[1.02]'
              }`}
            style={isSelected ? {
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
            } : undefined}
                      >
            {React.createElement(getIconComponent(agent.icon.length === 1 ? convertEmojiToIcon(agent.icon) : agent.icon), {
              theme: 'outline',
              size: 16,
              fill: 'currentColor',
              strokeWidth: 2
            })}
            {/* 选中状态指示器 */}
            {isSelected && (
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 rounded-full theme-bg-accent" />
            )}

            {/* Tooltip 显示在上方 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded shadow-lg bg-black/80 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {agent.name}
            </div>
          </button>
        );
                  })}

        {/* 更多智能体按钮*/}
        {(aiConfig.agents || []).length > (isMobile ? 3 : isTablet ? 4 : 6) && (
          <div className="relative" ref={agentDropdownRef}>
            <button onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="p-2 rounded-lg text-sm theme-bg-secondary/20 hover:theme-bg-secondary/40 theme-text-secondary hover:theme-text-primary transition-colors"
              title="更多智能体"
            >
              <ChevronDown size={16} 
                className={`transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
        {showAgentDropdown && (
          <div className="absolute bottom-full left-0 mb-2 rounded-xl shadow-lg z-[9999] min-w-[200px] max-h-64 overflow-y-auto feather-glass-dropdown">
            <div className="p-2">
              {(aiConfig.agents || []).map(agent => {
                const isSelected = currentAgent?.id === agent.id;
                return (
                  <button key={agent.id} onClick={() => handleAgentSelect(agent)}
                    className={`w-full px-3 py-2 text-sm text-left hover:theme-bg-secondary/50 transition-all duration-200 rounded-lg flex items-center gap-2 ${isSelected ? 'theme-bg-accent/20 theme-text-accent border-l-2 theme-border-accent font-medium' : 'theme-text-primary hover:theme-text-accent'
                    }`}
                  >
              <div className="flex-shrink-0">
                {React.createElement(getIconComponent(agent.icon.length === 1 ? convertEmojiToIcon(agent.icon) : agent.icon), {
                  theme: 'outline',
                  size: 16,
                  fill: 'currentColor',
                  strokeWidth: 2
                })}
              </div>
              <span className="font-medium truncate">{agent.name}</span>
              {isSelected && <span className="text-xs theme-text-accent">已选中</span>}
                  </button>
                );
              })}
            </div>

            <div className="border-t theme-border p-2">
              <button onClick={() => {
                  setSettingsModalOpen(true);
                  setShowAgentDropdown(false);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:theme-bg-secondary/50 transition-colors theme-text-accent rounded-lg flex items-center gap-2"
              >
              <Bot size={16} />
                管理智能体
              </button>
            </div>
          </div>
        )}
      </div>
    ) : (
        <button onClick={() => setSettingsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-xs theme-bg-secondary/20 hover:theme-bg-secondary/40 theme-text-secondary hover:theme-text-accent rounded-lg transition-colors"
        >
          <Bot size={16} />
          <span className={isMobile ? 'hidden' : ''}>创建智能体</span>
        </button>
    )}
  </div>

        {/* 右侧：模型选择器 */}
        <div className="relative" ref={modelDropdownRef}>
  <button onClick={() => setShowModelDropdown(!showModelDropdown)}
    className="flex items-center gap-2 px-3 py-2 theme-bg-secondary/30 hover:theme-bg-secondary/50 theme-border backdrop-blur-sm rounded-lg text-sm theme-text-primary transition-colors"
  >
    <span className="text-base">{getCurrentUnifiedModel()?.icon || '🤖'}</span>
  {!isMobile && (
    <span className="text-left truncate max-w-[120px]">{getCurrentUnifiedModel()?.name || 'DeepSeek Chat'}</span>
  )}
    <ChevronDown size={16}
      className={`theme-text-secondary transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} 
    />
  </button>
        {/* 模型下拉菜单 */}
        {
  showModelDropdown && (
    <div className="absolute bottom-full right-0 mb-2 rounded-xl shadow-lg z-[9999] min-w-[200px] feather-glass-dropdown">
      <div className="p-2 space-y-1">
        {UNIFIED_MODELS.map(model => {
          const isSelected = getCurrentUnifiedModel()?.id === model.id;
          const isEnabled = aiConfig[model.provider]?.enabled;

          return (
            <button key={model.id} onClick={() => {
                if (!isEnabled) {
                  setAiChatError(`${AI_PROVIDERS[model.provider].name} 未配置，请先在设置中配置 API`);
                  return;
                }
                handleModelSelect(model);
              }}
        
            className={`w-full px-3 py-2 text-sm text-left hover:theme-bg-secondary/50 transition-colors rounded-lg flex items-center gap-2 ${isSelected
            ? 'theme-bg-secondary theme-text-accent'
            : isEnabled
              ? 'theme-text-primary'
              : 'theme-text-secondary opacity-50 hover:opacity-75'
          }`}
                        >
        <span className="text-base">{model.icon}</span>
        <span className="flex-1">{model.name}</span>
        {isSelected && <span className="text-xs theme-text-accent">已选中</span>}
        </button>
            );
          })}
      </div>
          </div>
        )
      }
        </div>
      </div>

      {/* 图片上传区域 */}
      {
        (showImageUpload || selectedImages.length > 0) && (
          <div className="rounded-lg p-3 feather-glass-deco">
            <ImageUpload images={selectedImages} onImagesChange={setSelectedImages}
              maxImages={4} maxSize={16} />
          </div>
        )
      }
        </div>
      </div>

    </div>
  );
};












