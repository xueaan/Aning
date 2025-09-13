import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { ModelSelector } from './components/ModelSelector';
import { ConversationHistory } from './components/ConversationHistory';
import { useMessageStreaming } from './hooks/useMessageStreaming';
import { useAppStore } from '@/stores';

export const DialogueRoom: React.FC = () => {
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  
  // 响应式Hook
  const { isMobile } = useResponsive();
  
  // 消息流式处理
  const { streamingResponse, isStreaming, sendMessage } = useMessageStreaming();
  
  // AI Store
  const { aiChat, createConversation } = useAppStore();

  const handleSendMessage = (content: string, images?: string[]) => {
    // 如果没有当前对话，创建一个新对话
    if (!aiChat.currentConversationId) {
      createConversation();
    }
    
    sendMessage(content, images);
  };

  return (
    <div className="h-full flex flex-col theme-bg-primary">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b theme-border-primary bg-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* 对话历史按钮 */}
            <button
              onClick={() => setShowConversationHistory(true)}
              className="flex items-center gap-2 px-3 py-2 theme-bg-secondary hover:theme-bg-tertiary rounded-lg transition-colors"
              title="对话历史"
            >
              <Clock size={16} />
              {!isMobile && <span className="text-sm">历史</span>}
            </button>
          </div>

          {/* 模型选择器 */}
          <ModelSelector />
        </div>
      </div>

      {/* 消息区域 */}
      <MessageList 
        streamingResponse={streamingResponse}
        isStreaming={isStreaming}
      />

      {/* 输入区域 */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
      />

      {/* 对话历史弹窗 */}
      <ConversationHistory 
        isOpen={showConversationHistory}
        onClose={() => setShowConversationHistory(false)}
      />
    </div>
  );
};