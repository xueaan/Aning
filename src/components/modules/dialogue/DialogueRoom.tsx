import React, { useState, useRef, useEffect } from 'react';
import { Plus, Clock, ChevronDown, Trash2, Bot, Edit3 } from 'lucide-react';
import { useAppStore } from '@/stores';
import { useResponsive } from '@/hooks/useResponsive';
import { sendAiMessageStream } from '@/utils/aiUtils';
import {
  AiMessage,
  AI_PROVIDERS,
  UNIFIED_MODELS,
  UnifiedModel,
  getUnifiedModel,
  getCurrentAgent,
  AiAgent,
} from '@/types/aiConfig';
import { AiDatabaseSync } from '@/utils/aiDatabaseSync';
import { TypewriterMessage } from '@/components/common/TypewriterMessage';
import { ImageUpload } from '@/components/common/ImageUpload';
import { SmartInput } from '@/components/dialogue/SmartInput';
import { useDialogueContextStore } from '@/stores';
import { getIconComponent, convertEmojiToIcon } from '@/constants/commonIcons';
import { filterAIResponse, filterStreamChunk } from '@/utils/aiContentFilter';

export const DialogueRoom: React.FC = () => {
  const [message, setMessage] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  // 编辑标题相关状态
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
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
    setCurrentAgent,
    updateConversationTitle,
  } = useAppStore();

  // Context dialogue store
  const { activeContexts } = useDialogueContextStore();

  const currentProvider = aiConfig.currentProvider;
  const currentConfig = aiConfig[currentProvider];
  const currentConversation = aiChat.conversations.find(
    (c) => c.id === aiChat.currentConversationId
  );
  const currentAgent = getCurrentAgent(aiConfig);
  const isLoadingConversation = aiChat.isLoadingConversation;

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

      if (showConversationHistory) {
        if (!target.closest('[data-conversation-history]')) {
          setShowConversationHistory(false);
        }
      }

      if (
        showModelDropdown &&
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(target as Node)
      ) {
        setShowModelDropdown(false);
      }
      if (
        showAgentDropdown &&
        agentDropdownRef.current &&
        !agentDropdownRef.current.contains(target as Node)
      ) {
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
            // 检查是否有图片类型
            for (const type of clipboardItem.types) {
              if (type.startsWith('image/')) {
                const blob = await clipboardItem.getType(type);

                // 转换为Base64
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64 = e.target?.result as string;
                  if (base64) {
                    setSelectedImages((prev) => [...prev, base64]);
                    setShowImageUpload(true);
                  }
                };
                reader.readAsDataURL(blob);
                break;
              }
            }
          }
        } catch (error) {
          console.error('无法读取剪贴板内容:', error);
        }
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleGlobalPaste);
    return () => {
      document.removeEventListener('keydown', handleGlobalPaste);
    };
  }, []);

  // 获取当前统一模型
  const getCurrentUnifiedModel = (): UnifiedModel | undefined => {
    return getUnifiedModel(currentConfig.model);
  };

  // 处理模型选择
  const handleModelSelect = (model: UnifiedModel) => {
    if (model.provider !== currentProvider) {
      setCurrentAiProvider(model.provider as any);
    }
    updateAiConfig(model.provider as any, { model: model.id });
    setShowModelDropdown(false);
  };

  // 处理智能体选择
  const handleAgentSelect = (agent: AiAgent) => {
    setCurrentAgent(agent.id);
    setShowAgentDropdown(false);
  };

  // 编辑对话标题相关函数
  const handleStartEditing = (
    conversationId: string,
    currentTitle: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    event.preventDefault();
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle);
  };

  const handleCancelEditing = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleSaveTitle = async (conversationId: string) => {
    try {
      await updateConversationTitle(conversationId, editingTitle);
      setEditingConversationId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('保存标题失败:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, conversationId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveTitle(conversationId);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEditing();
    }
  };

  // 发送消息
  const handleSend = async () => {
    if ((!message.trim() && selectedImages.length === 0) || isStreaming) {
      return;
    }

    const messageText = message.trim();
    const images = selectedImages.length > 0 ? [...selectedImages] : undefined;

    // 如果没有当前对话，创建一个新对话
    if (!aiChat.currentConversationId) {
      createConversation();
    }

    // 收集活动上下文数据
    const contextData = activeContexts.size > 0 ? Array.from(activeContexts.values()) : undefined;

    // 构建包含上下文的完整消息内容
    let fullMessageContent = messageText;
    if (contextData && contextData.length > 0) {
      const contextText = contextData
        .map((ctx) => {
          const typeLabel =
            ctx.type === 'task_list'
              ? '任务列表'
              : ctx.type === 'task'
                ? '任务'
                : ctx.type === 'knowledge_page'
                  ? '知识库页面'
                  : '上下文';
          return `[${typeLabel}: ${ctx.title}]\n${ctx.content}`;
        })
        .join('\n\n---\n\n');

      fullMessageContent = `以下是相关的上下文信息：\n\n${contextText}\n\n---\n\n用户问题: ${messageText}`;
    }

    // 添加用户消息到历史记录（保存原始消息文本）
    const userMessage: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
      hasImages: images ? images.length > 0 : false,
      imageCount: images?.length || 0,
    };

    // 清空输入
    setMessage('');
    setSelectedImages([]);
    setShowImageUpload(false);

    // 暂时注释掉自动清空上下文的逻辑
    // 让用户手动控制上下文的管理
    // if (activeContexts.size > 0) {
    //   clearAllContexts();
    // }

    addMessage(userMessage);

    try {
      setIsStreaming(true);
      setStreamingResponse('');
      setAiChatError(null);

      // 构建消息历史
      let previousMessages =
        currentConversation?.messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })) || [];

      // 如果有当前智能体且有系统提示词，在开头添加系统消息
      if (currentAgent?.systemPrompt) {
        previousMessages = [
          {
            role: 'system' as const,
            content: currentAgent.systemPrompt,
          },
          ...previousMessages,
        ];
      }

      await sendAiMessageStream(
        currentProvider,
        currentConfig,
        fullMessageContent,
        images || [],
        previousMessages,
        (token: string) => {
          // 应用流式内容过滤
          const filteredToken = filterStreamChunk(token, streamingResponse, currentAgent);
          if (filteredToken) {
            setStreamingResponse((prev) => prev + filteredToken);
          }
        },
        (fullResponse: string) => {
          // 应用完整内容过滤
          const filteredResponse = filterAIResponse(fullResponse, currentAgent);

          const aiMessage: AiMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: filteredResponse,
            timestamp: Date.now(),
          };

          // 先添加消息，然后清空流式响应
          addMessage(aiMessage);
          setStreamingResponse('');
          setIsStreaming(false);

          // 同步到数据库
          const updatedConversation = {
            ...currentConversation!,
            messages: [...(currentConversation?.messages || []), userMessage, aiMessage],
            updatedAt: Date.now(),
          };
          AiDatabaseSync.syncConversationWithMessages(
            updatedConversation,
            updatedConversation.messages
          );
        },
        (error: string) => {
          console.error('AI streaming request failed:', error);
          setAiChatError(error);
          setIsStreaming(false);
          setStreamingResponse('');
        }
      );
    } catch (error) {
      console.error('AI message send error:', error);
      setAiChatError('消息发送失败，请重试');
      setIsStreaming(false);
      setStreamingResponse('');
    }
  };

  // 渲染消息头像
  const renderAvatar = (message: AiMessage) => {
    if (message.role === 'user') {
      return (
        <div className="w-8 h-8 rounded-full theme-bg-accent flex items-center justify-center text-white font-medium">
          U
        </div>
      );
    } else {
      if (currentAgent?.icon) {
        const IconComponent = getIconComponent(currentAgent.icon);
        if (IconComponent) {
          return (
            <div className="w-8 h-8 rounded-full feather-glass-button flex items-center justify-center theme-text-primary">
              <IconComponent size={16} />
            </div>
          );
        }
      }

      return (
        <div className="w-8 h-8 rounded-full feather-glass-button flex items-center justify-center theme-text-primary">
          <Bot size={16} />
        </div>
      );
    }
  };

  // 渲染消息
  const renderMessage = (message: AiMessage) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-4 ${isMobile ? 'px-2' : 'px-4'} ${isUser ? 'flex-row-reverse' : ''}`}
      >
        {/* 头像 */}
        <div className="flex-shrink-0">{renderAvatar(message)}</div>

        {/* 消息内容 */}
        <div
          className={`flex-1 ${isMobile ? 'max-w-[85%]' : isTablet ? 'max-w-[80%]' : 'max-w-[75%]'} ${isUser ? 'flex flex-col items-end' : ''}`}
        >
          <div
            className={`inline-block p-2.5 rounded-xl ${
              isUser ? 'bg-accent text-white rounded-br-sm' : 'feather-glass-deco rounded-bl-sm'
            }`}
          >
            <TypewriterMessage
              content={message.content}
              enableTypewriter={false}
              speed={25}
              className={isUser ? 'text-white' : ''}
            />
            {/* 图片显示 */}
            {message.hasImages && (
              <div className={`mt-2 text-sm ${isUser ? 'text-white/80' : 'theme-text-tertiary'}`}>
                📷 包含 {message.imageCount || 1} 张图片
              </div>
            )}
          </div>

          {/* 时间戳 */}
          <div
            className={`text-xs theme-text-tertiary mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col feather-glass-content">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 feather-glass-bottom-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* 新建对话按钮 */}
            <button
              onClick={createConversation}
              className="flex items-center gap-2 px-3 py-2 feather-glass-button rounded-lg transition-colors"
              title="新建对话"
            >
              <Plus size={16} />
              {!isMobile && <span className="text-sm">新建</span>}
            </button>

            {/* 对话历史按钮 */}
            <button
              onClick={() => setShowConversationHistory(true)}
              className="flex items-center gap-2 px-3 py-2 feather-glass-button rounded-lg transition-colors"
              title="对话历史"
              data-conversation-history
            >
              <Clock size={16} />
              {!isMobile && <span className="text-sm">历史</span>}
            </button>
          </div>
        </div>
      </div>

      {/* 对话历史弹窗 */}
      {showConversationHistory && (
        <div
          className="fixed inset-0 feather-glass-modal-backdrop flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={() => setShowConversationHistory(false)}
        >
          <div
            className="w-96 max-h-[80vh] feather-glass-modal rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-conversation-history
          >
            {/* 标题栏 */}
            <div className="p-4 border-b theme-border-primary">
              <h3 className="text-lg font-medium theme-text-primary">对话历史</h3>
            </div>

            {/* 对话列表 */}
            <div className="flex-1 overflow-y-auto max-h-96 p-2">
              {aiChat.conversations.length > 0 ? (
                aiChat.conversations.map((conv) => {
                  const isActive = conv.id === aiChat.currentConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={async () => {
                        await setCurrentConversation(conv.id);
                        setShowConversationHistory(false);
                      }}
                      className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'theme-bg-accent theme-text-on-accent font-medium'
                          : 'hover:feather-glass-hover theme-text-primary'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        {editingConversationId === conv.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, conv.id)}
                            onBlur={() => handleSaveTitle(conv.id)}
                            className={`w-full bg-transparent border border-gray-400 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 ${
                              isActive ? 'text-white placeholder-white/50' : 'theme-text-primary'
                            }`}
                            placeholder="输入标题..."
                            maxLength={50}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="truncate">{conv.title}</div>
                        )}
                        <div
                          className={`text-xs mt-1 ${isActive ? 'theme-text-on-accent/70' : 'theme-text-secondary'}`}
                        >
                          {conv.messages.length} 消息 ·{' '}
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* 按钮组 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEditing(conv.id, conv.title, e)}
                          className="flex-shrink-0 p-1 hover:bg-blue-500/20 rounded transition-all"
                          title="编辑标题"
                        >
                          <Edit3
                            size={14}
                            className={isActive ? 'text-white/70' : 'text-blue-500'}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="flex-shrink-0 p-1 hover:theme-bg-error/10 rounded theme-text-error transition-all"
                          title="删除对话"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center theme-text-secondary text-sm">
                  <div className="w-12 h-12 mx-auto mb-3 feather-glass-deco rounded-full flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <p>还没有对话历史</p>
                  <p className="text-xs mt-1">开始新对话后会显示在这里</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {isLoadingConversation ? (
          /* 加载对话提示 */
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4">
                <div className="w-12 h-12 feather-glass-deco rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 theme-border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="theme-text-secondary text-sm">正在加载对话内容...</div>
            </div>
          </div>
        ) : currentConversation && currentConversation.messages.length > 0 ? (
          <div>
            {currentConversation.messages.map(renderMessage)}

            {/* AI思考动画 */}
            {isStreaming && !streamingResponse && (
              <div className="flex gap-3 mb-3 px-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 feather-glass-deco rounded-full flex items-center justify-center">
                    <Bot size={16} className="theme-text-accent" />
                  </div>
                </div>
                <div
                  className={`flex-1 ${isMobile ? 'max-w-[90%]' : isTablet ? 'max-w-[85%]' : 'max-w-[75%]'}`}
                >
                  <div className="inline-block p-2.5 rounded-xl feather-glass-deco">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-1">
                        <div
                          className="w-1.5 h-1.5 theme-bg-accent rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 theme-bg-accent rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 theme-bg-accent rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                      <span className="text-xs theme-text-secondary">正在思考..</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 流式响应 */}
            {isStreaming && streamingResponse && (
              <div className="flex gap-3 mb-3 px-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 feather-glass-deco rounded-full flex items-center justify-center">
                    <Bot size={16} className="theme-text-accent" />
                  </div>
                </div>
                <div
                  className={`flex-1 ${isMobile ? 'max-w-[90%]' : isTablet ? 'max-w-[85%]' : 'max-w-[75%]'}`}
                >
                  <div className="inline-block p-2.5 rounded-xl feather-glass-deco">
                    <TypewriterMessage
                      content={streamingResponse}
                      enableTypewriter={false}
                      speed={25}
                      className=""
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
              <div className="mx-auto mb-6">
                <div className="w-16 h-16 feather-glass-deco rounded-full flex items-center justify-center">
                  <Bot size={32} className="theme-text-accent" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="theme-text-primary text-lg font-medium">欢迎来到对话室</div>
                <div className="text-sm theme-text-secondary">发送消息开始对话，探索更多可能性</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {aiChat.error && (
        <div className="mx-4 mb-2 p-3 theme-bg-error/20 border theme-border-error backdrop-blur-sm rounded-lg theme-text-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="theme-text-error">⚠️</span>
            <span>{aiChat.error}</span>
          </div>
          <button
            onClick={() => setAiChatError(null)}
            className="ml-2 p-1 hover:theme-bg-error/10 rounded theme-text-error transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div className="px-2 py-1">
        <div className="rounded-xl p-2 space-y-2 feather-glass-panel">
          {/* 智能输入框组件 */}
          <SmartInput
            value={message}
            onChange={setMessage}
            onSend={handleSend}
            disabled={isStreaming}
            placeholder={
              selectedImages.length > 0
                ? '描述一下这些图片..'
                : '输入消息，使用 @ 添加知识库页面或任务到上下文...'
            }
            showImageUpload={showImageUpload}
            onImageUploadToggle={() => setShowImageUpload(!showImageUpload)}
          />

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between gap-3">
            {/* 左侧：智能体快捷按钮 */}
            <div className="flex items-center gap-2">
              {(aiConfig.agents || []).length > 0 ? (
                <div className="flex items-center gap-1">
                  {(aiConfig.agents || [])
                    .slice(0, isMobile ? 3 : isTablet ? 4 : 6)
                    .map((agent) => {
                      const isSelected = currentAgent?.id === agent.id;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => handleAgentSelect(agent)}
                          className={`p-2 rounded-lg text-sm transition-all duration-200 relative group ${
                            isSelected
                              ? 'theme-bg-accent/20 theme-text-accent shadow-sm ring-1 ring-accent/20'
                              : 'feather-glass-button hover:scale-[1.02]'
                          }`}
                        >
                          {React.createElement(
                            getIconComponent(
                              agent.icon.length === 1 ? convertEmojiToIcon(agent.icon) : agent.icon
                            ),
                            {
                              theme: 'outline',
                              size: 16,
                              fill: 'currentColor',
                              strokeWidth: 2,
                            }
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
                      <button
                        onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                        className="p-2 rounded-lg text-sm feather-glass-button transition-colors"
                        title="更多智能体"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {showAgentDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 rounded-xl shadow-lg z-[9999] min-w-[200px] max-h-64 overflow-y-auto feather-glass-dropdown">
                          <div className="p-2">
                            {(aiConfig.agents || []).map((agent) => {
                              const isSelected = currentAgent?.id === agent.id;
                              return (
                                <button
                                  key={agent.id}
                                  onClick={() => handleAgentSelect(agent)}
                                  className={`w-full px-3 py-2 text-sm text-left hover:theme-bg-secondary/50 transition-all duration-200 rounded-lg flex items-center gap-2 ${isSelected ? 'theme-bg-accent/20 theme-text-accent border-l-2 theme-border-accent font-medium' : 'theme-text-primary hover:theme-text-accent'}`}
                                >
                                  <div className="flex-shrink-0">
                                    {React.createElement(
                                      getIconComponent(
                                        agent.icon.length === 1
                                          ? convertEmojiToIcon(agent.icon)
                                          : agent.icon
                                      ),
                                      {
                                        theme: 'outline',
                                        size: 16,
                                        fill: 'currentColor',
                                        strokeWidth: 2,
                                      }
                                    )}
                                  </div>
                                  <span className="font-medium truncate">{agent.name}</span>
                                  {isSelected && (
                                    <span className="text-xs theme-text-accent">已选中</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <div className="border-t theme-border p-2">
                            <button
                              onClick={() => {
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
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-xs feather-glass-button rounded-lg transition-colors"
                >
                  <Bot size={16} />
                  <span className={isMobile ? 'hidden' : ''}>创建智能体</span>
                </button>
              )}
            </div>

            {/* 右侧：模型选择器 */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-3 py-2 feather-glass-button rounded-lg text-sm theme-text-primary transition-colors"
              >
                <span className="text-base">{getCurrentUnifiedModel()?.icon || '🤖'}</span>
                {!isMobile && (
                  <span className="text-left truncate max-w-[120px]">
                    {getCurrentUnifiedModel()?.name || 'DeepSeek Chat'}
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={`theme-text-secondary transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {/* 模型下拉菜单 */}
              {showModelDropdown && (
                <div className="absolute bottom-full right-0 mb-2 rounded-xl shadow-lg z-[9999] min-w-[200px] feather-glass-dropdown">
                  <div className="p-2 space-y-1">
                    {UNIFIED_MODELS.map((model) => {
                      const isSelected = getCurrentUnifiedModel()?.id === model.id;
                      const isEnabled = aiConfig[model.provider]?.enabled;

                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            if (!isEnabled) {
                              setAiChatError(
                                `${AI_PROVIDERS[model.provider].name} 未配置，请先在设置中配置 API`
                              );
                              return;
                            }
                            handleModelSelect(model);
                          }}
                          className={`w-full px-3 py-2 text-sm text-left hover:theme-bg-secondary/50 transition-colors rounded-lg flex items-center gap-2 ${
                            isSelected
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

                  <div className="border-t theme-border p-2">
                    <button
                      onClick={() => {
                        setSettingsModalOpen(true);
                        setShowModelDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:theme-bg-secondary/50 transition-colors theme-text-accent rounded-lg"
                    >
                      ⚙️ 模型设置
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 图片上传组件 - 条件显示 */}
          {(selectedImages.length > 0 || showImageUpload) && (
            <ImageUpload images={selectedImages} onImagesChange={setSelectedImages} maxImages={5} />
          )}
        </div>
      </div>
    </div>
  );
};
