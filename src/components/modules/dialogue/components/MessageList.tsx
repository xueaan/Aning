import React, { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { TypewriterMessage } from '@/components/common/TypewriterMessage';
import { AiMessage, getCurrentAgent } from '@/types/aiConfig';
import { useAppStore } from '@/stores';
import { getIconComponent } from '@/constants/commonIcons';

interface MessageListProps {
  streamingResponse?: string;
  isStreaming?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  streamingResponse = '',
  isStreaming = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { aiConfig, aiChat } = useAppStore();

  const currentConversation = aiChat.conversations.find(
    (c) => c.id === aiChat.currentConversationId
  );
  const currentAgent = getCurrentAgent(aiConfig);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingResponse]);

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
            <div className="w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center theme-text-primary">
              <IconComponent size={16} />
            </div>
          );
        }
      }

      return (
        <div className="w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center theme-text-primary">
          <Bot size={16} />
        </div>
      );
    }
  };

  // 渲染消息内容
  const renderMessageContent = (message: AiMessage) => {
    return (
      <div className="flex-1 min-w-0">
        <div
          className={`prose max-w-none ${
            message.role === 'user' ? 'theme-text-primary' : 'theme-text-secondary'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* 图片显示 */}
          {message.hasImages && (
            <div className="mt-2 text-sm theme-text-tertiary">
              📷 包含 {message.imageCount || 1} 张图片
            </div>
          )}
        </div>

        <div className="text-xs theme-text-tertiary mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Bot size={48} className="theme-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium theme-text-secondary mb-2">开始新的对话</h3>
          <p className="theme-text-tertiary">选择一个AI助手，然后开始对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 历史消息 */}
        {currentConversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {renderAvatar(message)}

            <div
              className={`flex-1 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-accent text-white rounded-2xl rounded-tr-sm p-4'
                  : 'feather-glass-deco rounded-2xl rounded-tl-sm p-4'
              }`}
            >
              {renderMessageContent(message)}
            </div>
          </div>
        ))}

        {/* 流式响应中的消息 */}
        {isStreaming && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center theme-text-primary">
              <Bot size={16} />
            </div>

            <div className="flex-1 max-w-[80%] feather-glass-deco rounded-2xl rounded-tl-sm p-4">
              <div className="prose max-w-none theme-text-secondary">
                <TypewriterMessage content={streamingResponse} />
              </div>
            </div>
          </div>
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
