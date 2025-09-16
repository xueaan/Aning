import React, { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { BookCard } from '@/components/reading/BookCard';
import { BookDetail } from '@/components/reading/BookDetail';
import { BookQuickAdd } from '@/components/reading/BookQuickAdd';
import { cn } from '@/lib/utils';
import type { Book, BookStatus } from '@/types/book';

const BookShelf: React.FC = () => {
  const {
    books,
    currentBook,
    filters,
    isLoading,
    loadBooks,
    setCurrentBook,
    setFilters,
    deleteBook,
    updateBook,
    startReading,
    markAsFinished,
  } = useBookStore();

  const [showDetail, setShowDetail] = useState(false);

  // 初始化加载
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // 处理状态筛选
  const handleStatusFilter = (status: BookStatus | 'all') => {
    setFilters({ ...filters, status });
    if (status === 'all') {
      loadBooks();
    } else {
      loadBooks(status);
    }
  };

  // 打开书籍详情
  const handleBookClick = (book: Book) => {
    setCurrentBook(book);
    setShowDetail(true);
  };

  // 删除书籍
  const handleDeleteBook = async (bookId: string) => {
    if (confirm('确定要删除这本书吗？相关的笔记和高亮也会被删除。')) {
      await deleteBook(bookId);
    }
  };

  // 更新阅读进度
  const handleUpdateProgress = async (bookId: string, currentPage: number) => {
    await updateBook(bookId, { current_page: currentPage });
  };

  // 开始阅读
  const handleStartReading = async (bookId: string) => {
    await startReading(bookId);
  };

  // 标记为已读
  const handleMarkAsFinished = async (bookId: string) => {
    await markAsFinished(bookId);
  };

  // 计算统计数据
  const stats = {
    total: books.length,
    reading: books.filter((b) => b.status === 'reading').length,
    finished: books.filter((b) => b.status === 'finished').length,
    wanted: books.filter((b) => b.status === 'wanted').length,
  };

  // 如果正在显示详情，渲染详情页
  if (showDetail && currentBook) {
    return (
      <BookDetail
        book={currentBook}
        onBack={() => {
          setShowDetail(false);
          setCurrentBook(null);
        }}
        onUpdateProgress={handleUpdateProgress}
        onStartReading={handleStartReading}
        onMarkAsFinished={handleMarkAsFinished}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b border-[rgba(var(--border-primary),0.15)]">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="w-8 h-8 text-[rgba(var(--text-primary),1)]" />
          <h1 className="text-2xl font-bold text-[rgba(var(--text-primary),1)]">阅读志</h1>
          <span className="text-sm text-[rgba(var(--text-secondary),1)] ml-2">
            共 {stats.total} 本书
          </span>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="flex items-center gap-6 px-6 py-4 border-b border-[rgba(var(--border-primary),0.15)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusFilter('all')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filters.status === 'all'
                ? 'feather-glass-active text-white'
                : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
            )}
          >
            全部 ({stats.total})
          </button>
          <button
            onClick={() => handleStatusFilter('reading')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filters.status === 'reading'
                ? 'bg-green-500 text-white'
                : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
            )}
          >
            在读 ({stats.reading})
          </button>
          <button
            onClick={() => handleStatusFilter('finished')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filters.status === 'finished'
                ? 'bg-blue-500 text-white'
                : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
            )}
          >
            已读 ({stats.finished})
          </button>
          <button
            onClick={() => handleStatusFilter('wanted')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filters.status === 'wanted'
                ? 'bg-orange-500 text-white'
                : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
            )}
          >
            想读 ({stats.wanted})
          </button>
        </div>
      </div>

      {/* 书籍列表 */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-[rgba(var(--text-secondary),1)]">
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <BookOpenCheck className="w-16 h-16 text-[rgba(var(--text-tertiary),1)] mb-4" />
            <h3 className="text-xl font-semibold text-[rgba(var(--text-primary),1)] mb-2">
              书架还是空的
            </h3>
            <p className="text-[rgba(var(--text-secondary),1)] mb-6">
              点击右下角按钮添加你的第一本书
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => handleBookClick(book)}
                onDelete={() => handleDeleteBook(book.id)}
                onStartReading={() => handleStartReading(book.id)}
                onMarkAsFinished={() => handleMarkAsFinished(book.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 快速添加组件 */}
      <div className="fixed bottom-6 right-6 z-[7000]">
        <BookQuickAdd onBookAdded={() => loadBooks()} />
      </div>
    </div>
  );
};

export default BookShelf;
