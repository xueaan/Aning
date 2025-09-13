import React from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores';

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    aiChat, 
    createConversation, 
    setCurrentConversation, 
    deleteConversation 
  } = useAppStore();

  const handleNewConversation = () => {
    createConversation();
    onClose();
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    onClose();
  };

  const handleDeleteConversation = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteConversation(conversationId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="w-96 max-h-[80vh] theme-bg-primary theme-border-primary border rounded-lg shadow-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
        data-conversation-history
      >
        {/* 标题栏 */}
        <div className="p-4 border-b theme-border-primary">
          <h3 className="text-lg font-medium theme-text-primary">对话历史</h3>
        </div>

        {/* 新建对话按钮 */}
        <div className="p-4 border-b theme-border-primary">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2 theme-bg-accent hover:opacity-90 text-white rounded-lg transition-opacity"
          >
            <Plus size={16} />
            新建对话
          </button>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {aiChat.conversations.length === 0 ? (
            <div className="p-6 text-center">
              <Clock size={32} className="theme-text-tertiary mx-auto mb-2" />
              <p className="theme-text-tertiary">暂无对话历史</p>
            </div>
          ) : (
            <div className="p-2">
              {aiChat.conversations.map(conversation => {
                const isActive = conversation.id === aiChat.currentConversationId;
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive 
                        ? 'theme-bg-accent text-white' 
                        : 'hover:theme-bg-secondary theme-text-primary'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${
                        isActive ? 'text-white' : 'theme-text-primary'
                      }`}>
                        {conversation.title}
                      </div>
                      
                      {lastMessage && (
                        <div className={`text-xs truncate mt-1 ${
                          isActive ? 'text-white/70' : 'theme-text-tertiary'
                        }`}>
                          {lastMessage.role === 'user' ? '你: ' : 'AI: '}
                          {lastMessage.content.slice(0, 50)}...
                        </div>
                      )}
                      
                      <div className={`text-xs mt-1 ${
                        isActive ? 'text-white/50' : 'theme-text-tertiary'
                      }`}>
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* 删除按钮 */}
                    {!isActive && (
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                        title="删除对话"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};