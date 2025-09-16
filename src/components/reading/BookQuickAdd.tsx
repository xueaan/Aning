import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Check, X, BookOpenCheck } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { cn } from '@/lib/utils';
import type { BookCreate } from '@/types/book';

interface BookQuickAddProps {
  onBookAdded?: () => void;
  className?: string;
}

export const BookQuickAdd: React.FC<BookQuickAddProps> = ({ onBookAdded, className = '' }) => {
  const { createBook, fetchDoubanBook } = useBookStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookData, setBookData] = useState<BookCreate | null>(null);
  const [error, setError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 豆瓣URL正则
  const doubanUrlRegex = /https?:\/\/book\.douban\.com\/subject\/(\d+)/;

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isLoading && !bookData) {
          handleCancel();
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isLoading, bookData]);

  // 处理展开
  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 处理取消
  const handleCancel = () => {
    if (!isLoading && !isSaving) {
      setIsExpanded(false);
      setInputValue('');
      setBookData(null);
      setError('');
    }
  };

  // 检测并处理输入
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError('');

    // 检测是否为豆瓣URL
    if (doubanUrlRegex.test(value)) {
      await fetchDoubanData(value);
    }
  };

  // 处理粘贴事件
  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (doubanUrlRegex.test(pastedText)) {
      e.preventDefault();
      setInputValue(pastedText);
      await fetchDoubanData(pastedText);
    }
  };

  // 获取豆瓣数据
  const fetchDoubanData = async (url: string) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchDoubanBook(url);

      // 转换豆瓣数据为书籍创建格式
      const bookInfo: BookCreate = {
        title: data.title || '',
        author: data.author || '',
        isbn: data.isbn || undefined,
        cover: data.cover_url || undefined,
        status: 'wanted',
        total_pages: data.pages || undefined,
        current_page: 0,
        rating: data.rating ? Math.round(data.rating / 2) : undefined, // 豆瓣10分制转5分制
        tags: data.tags || [],
        description: data.description || undefined,
      };

      setBookData(bookInfo);
      setInputValue(''); // 清空URL输入
    } catch (err) {
      console.error('获取豆瓣数据失败:', err);
      setError('获取书籍信息失败，请检查链接是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理回车键
  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (bookData) {
        await handleSave();
      } else if (inputValue.trim() && !doubanUrlRegex.test(inputValue)) {
        // 如果不是豆瓣URL，作为书名直接创建
        setBookData({
          title: inputValue.trim(),
          status: 'wanted',
        });
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 保存书籍
  const handleSave = async () => {
    if (!bookData || !bookData.title) {
      setError('请输入书名');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await createBook(bookData);

      // 重置状态
      setBookData(null);
      setInputValue('');
      setIsExpanded(false);

      // 回调
      onBookAdded?.();
    } catch (err) {
      console.error('保存书籍失败:', err);
      setError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染书籍预览
  const renderBookPreview = () => {
    if (!bookData) return null;

    return (
      <div className="mt-3 p-3 feather-glass-content rounded-lg">
        <div className="flex gap-3">
          {bookData.cover && (
            <img
              src={bookData.cover}
              alt={bookData.title}
              className="w-16 h-22 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium text-[rgba(var(--text-primary),1)]">{bookData.title}</h3>
            {bookData.author && (
              <p className="text-sm text-[rgba(var(--text-secondary),1)] mt-1">
                作者：{bookData.author}
              </p>
            )}
            {bookData.rating && (
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-sm',
                      i < bookData.rating! ? 'text-yellow-400' : 'text-gray-300'
                    )}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 feather-glass-button-primary rounded text-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check size={16} />
                添加到书架
              </>
            )}
          </button>
          <button
            onClick={() => {
              setBookData(null);
              setInputValue('');
              inputRef.current?.focus();
            }}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 text-[rgba(var(--text-secondary),1)] feather-glass-hover rounded text-sm transition-colors"
          >
            <X size={16} />
            重新输入
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <AnimatePresence>
        {!isExpanded ? (
          <motion.button
            key="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleExpand}
            className="w-14 h-14 feather-glass-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-105"
            title="添加书籍"
          >
            <Plus
              size={24}
              className="text-white transition-transform group-hover:rotate-90 duration-200"
            />
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ width: 56, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 56, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 right-0 feather-glass-modal rounded-lg shadow-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpenCheck className="w-5 h-5 text-[rgba(var(--text-primary),1)]" />
              <span className="text-sm font-medium text-[rgba(var(--text-primary),1)]">
                {isLoading ? '正在获取书籍信息...' : bookData ? '确认书籍信息' : '添加新书'}
              </span>
            </div>

            {!bookData && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyPress}
                placeholder="粘贴豆瓣链接或输入书名..."
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 feather-glass-input rounded-lg',
                  'border focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'placeholder-gray-400 disabled:opacity-50'
                )}
                autoComplete="off"
              />
            )}

            {isLoading && (
              <div className="mt-3 flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[rgba(var(--text-secondary),1)]" />
              </div>
            )}

            {error && <div className="mt-2 text-sm text-red-500">{error}</div>}

            {bookData && renderBookPreview()}

            {!bookData && !isLoading && (
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm text-[rgba(var(--text-secondary),1)] feather-glass-hover transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
