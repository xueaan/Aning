import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Calendar, Hash, X } from 'lucide-react';
import { useCardBoxStore } from '@/stores/cardBoxStore';
import { Card } from '@/stores/cardBoxStore';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface CardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
}

export const CardSearchModal: React.FC<CardSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { searchCards, cards, loadBoxes } = useCardBoxStore();

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      loadBoxes();
      // 默认显示所有卡片
      handleSearch('');
    }
  }, [isOpen, loadBoxes]);

  // 搜索处理函数
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      await searchCards(query);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 过滤的卡片列表
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return cards.slice(0, 20); // 默认显示前20个
    }
    return cards;
  }, [cards, searchQuery]);

  // 处理卡片选择
  const handleCardSelect = (card: Card) => {
    onSelectCard(card);
    onClose();
  };

  // 清理状态
  const handleClose = () => {
    setSearchQuery('');
    setSelectedCard(null);
    onClose();
  };

  // 获取卡片预览文本
  const getPreviewText = (card: Card): string => {
    if (card.preview) return card.preview;
    if (card.content) {
      // 简单提取文本内容，移除Markdown格式
      const plainText = card.content
        .replace(/#{1,6}\s+/g, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除加粗
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体
        .replace(/`(.*?)`/g, '$1') // 移除行内代码
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
        .replace(/\n/g, ' ') // 换行转空格
        .trim();

      return plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText;
    }
    return '暂无内容';
  };

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="feather-glass-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="feather-glass-modal w-[800px] max-w-[90vw] h-[600px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b theme-border-primary">
          <h2 className="text-base font-medium theme-text-primary">搜索笔记卡片</h2>
          <button onClick={handleClose}
            className="p-1 rounded-lg theme-text-tertiary hover:theme-text-primary hover:theme-bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 左侧：搜索和列表 */}
          <div className="flex-1 flex flex-col border-r theme-border-primary">
            {/* 搜索框 */}
            <div className="px-4 py-3 border-b theme-border-primary">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-tertiary" />
                <input type="text"
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索笔记内容..."
                  className="w-full pl-10 pr-4 py-2 feather-glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 theme-text-primary"
                  autoFocus
                />
              </div>
            </div>
            
            {/* 搜索结果列表 */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/50 border-t-transparent"></div>
                </div>
              ) : filteredCards.length > 0 ? (
                <div className="space-y-2">
                  {filteredCards.map((card) => (
                    <div 
                      key={card.id} 
                      onClick={() => setSelectedCard(card)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer transition-all feather-glass-deco',
                        selectedCard?.id === card.id
                          ? 'feather-glass-active border-blue-500/30'
                          : 'hover:feather-glass-hover'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 theme-text-secondary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium theme-text-primary truncate">
                            {card.title || '未命名笔记'}
                          </h4>
                          <p className="text-sm theme-text-secondary line-clamp-2 mt-1">
                            {getPreviewText(card)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs theme-text-tertiary">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(card.updated_at)}
                            </div>
                            {card.tags && card.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                <span>{card.tags.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 theme-text-tertiary">
                  <Search className="w-8 h-8 mb-2" />
                  <p>
                    {searchQuery ? '未找到匹配的笔记' : '暂无笔记'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧：预览区域 */}
          <div className="w-[350px] flex flex-col">
            {selectedCard ? (
              <>
                {/* 预览头部 */}
                <div className="px-4 py-3 border-b theme-border-primary feather-glass-deco">
                  <h3 className="font-medium theme-text-primary truncate">
                    {selectedCard.title || '未命名笔记'}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm theme-text-tertiary">
                    <span>创建于 {formatDate(selectedCard.created_at)}</span>
                    <span>更新于 {formatDate(selectedCard.updated_at)}</span>
                  </div>
                </div>
                
                {/* 预览内容 */}
                <div className="flex-1 p-4 overflow-y-auto feather-glass">
                  <div className="prose prose-sm max-w-none theme-text-primary">
                    {selectedCard.content ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed theme-text-primary break-words overflow-hidden">
                        {selectedCard.content}
                      </pre>
                    ) : (
                      <div className="theme-text-tertiary">暂无内容</div>
                    )}
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="px-4 py-3 border-t theme-border-primary feather-glass-deco">
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleClose}
                      className="px-3 py-1.5 text-sm rounded-lg feather-glass-button theme-text-secondary hover:theme-text-primary transition-colors"
                    >
                      取消
                    </button>
                    <button onClick={() => handleCardSelect(selectedCard)}
                      className="px-3 py-1.5 text-sm rounded-lg feather-glass-button-primary text-white transition-colors shadow-lg"
                    >
                      添加到思维板
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center feather-glass theme-text-tertiary">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>选择一个笔记查看预览</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};