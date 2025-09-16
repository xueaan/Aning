import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Book,
  Star,
  Tag,
  Edit,
  Highlighter,
  StickyNote,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { cn } from '@/lib/utils';
import type { Book as BookType } from '@/types/book';
import { CreateNoteModal } from './CreateNoteModal';
import { CreateHighlightModal } from './CreateHighlightModal';

interface BookDetailProps {
  book: BookType;
  onBack: () => void;
  onUpdateProgress: (bookId: string, currentPage: number) => void;
  onStartReading: (bookId: string) => void;
  onMarkAsFinished: (bookId: string) => void;
}

export const BookDetail: React.FC<BookDetailProps> = ({
  book,
  onBack,
  onUpdateProgress,
  onStartReading,
  onMarkAsFinished,
}) => {
  const {
    readingNotes,
    bookHighlights,
    loadReadingNotes,
    loadBookHighlights,
    createReadingNote,
    createBookHighlight,
    deleteReadingNote,
    deleteBookHighlight,
  } = useBookStore();

  const [activeTab, setActiveTab] = useState<'notes' | 'highlights' | 'stats'>('notes');
  const [currentPage, setCurrentPage] = useState(book.current_page);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    loadReadingNotes(book.id);
    loadBookHighlights(book.id);
  }, [book.id, loadReadingNotes, loadBookHighlights]);

  // 计算阅读进度
  const progressPercentage = book.total_pages
    ? Math.round((book.current_page / book.total_pages) * 100)
    : 0;

  // 处理进度更新
  const handleProgressUpdate = () => {
    if (currentPage !== book.current_page) {
      onUpdateProgress(book.id, currentPage);
    }
  };

  // 处理添加笔记
  const handleAddNote = async (note: any) => {
    await createReadingNote({
      book_id: book.id,
      ...note,
    });
    await loadReadingNotes(book.id);
  };

  // 处理添加高亮
  const handleAddHighlight = async (highlight: any) => {
    await createBookHighlight({
      book_id: book.id,
      ...highlight,
    });
    await loadBookHighlights(book.id);
  };

  // 渲染星级评分
  const renderRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i <= (book.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          )}
        />
      );
    }
    return stars;
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center gap-3 p-4 border-b border-[rgba(var(--border-primary),0.15)]">
        <button onClick={onBack} className="p-1.5 feather-glass-nav rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-[rgba(var(--text-primary),1)]" />
        </button>
        <h1 className="text-lg font-bold text-[rgba(var(--text-primary),1)] flex-1 truncate">
          {book.title}
        </h1>
        <button className="p-1.5 feather-glass-nav rounded-lg transition-colors">
          <Edit className="w-4 h-4 text-[rgba(var(--text-primary),1)]" />
        </button>
      </div>

      {/* 书籍信息 - 更紧凑的布局 */}
      <div className="p-4 border-b border-[rgba(var(--border-primary),0.15)]">
        <div className="flex gap-4">
          {/* 封面 - 响应式尺寸 */}
          <div className="w-20 h-28 sm:w-24 sm:h-36 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg overflow-hidden flex-shrink-0">
            {book.cover ? (
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Book className="w-8 h-8 sm:w-10 sm:h-10 text-white/50" />
              </div>
            )}
          </div>

          {/* 详细信息 - 更紧凑的网格 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2">
              {/* 第一行：作者和评分 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[rgba(var(--text-secondary),1)]">作者</p>
                  <p className="text-sm text-[rgba(var(--text-primary),1)] truncate">
                    {book.author || '未知'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[rgba(var(--text-secondary),1)]">评分</p>
                  <div className="flex items-center gap-0.5">{renderRating()}</div>
                </div>
              </div>

              {/* 第二行：状态和页数 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[rgba(var(--text-secondary),1)]">状态</p>
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-xs font-medium text-white',
                        book.status === 'reading' && 'bg-green-500',
                        book.status === 'finished' && 'bg-blue-500',
                        book.status === 'wanted' && 'bg-orange-500'
                      )}
                    >
                      {book.status === 'reading' && '在读'}
                      {book.status === 'finished' && '已读'}
                      {book.status === 'wanted' && '想读'}
                    </span>
                    {book.status === 'wanted' && (
                      <button
                        onClick={() => onStartReading(book.id)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        开始
                      </button>
                    )}
                    {book.status === 'reading' && (
                      <button
                        onClick={() => onMarkAsFinished(book.id)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        完成
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[rgba(var(--text-secondary),1)]">页数</p>
                  <p className="text-sm text-[rgba(var(--text-primary),1)]">
                    {book.total_pages || '未知'}
                  </p>
                </div>
              </div>
            </div>

            {/* 进度条 - 更紧凑的布局 */}
            {book.status === 'reading' && book.total_pages && (
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <p className="text-xs text-[rgba(var(--text-secondary),1)]">阅读进度</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Number(e.target.value))}
                      onBlur={handleProgressUpdate}
                      min={0}
                      max={book.total_pages}
                      className="w-16 px-1 py-0.5 text-xs feather-glass-input rounded border"
                    />
                    <span className="text-xs text-[rgba(var(--text-secondary),1)]">
                      / {book.total_pages} 页 ({progressPercentage}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[rgba(var(--bg-tertiary),0.5)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* 标签 - 更紧凑的样式 */}
            {book.tags && book.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Tag className="w-3 h-3 text-[rgba(var(--text-secondary),1)]" />
                <div className="flex flex-wrap gap-1">
                  {book.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs feather-glass-content text-[rgba(var(--text-secondary),1)] rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 描述 - 可折叠展开 */}
        {book.description && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-[rgba(var(--text-secondary),1)]">简介</p>
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"
              >
                {isDescriptionExpanded ? '收起' : '展开'}
                {isDescriptionExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="relative">
              <p
                className={cn(
                  'text-xs text-[rgba(var(--text-primary),0.9)] leading-relaxed transition-all duration-300',
                  !isDescriptionExpanded && 'line-clamp-2'
                )}
              >
                {book.description}
              </p>
              {!isDescriptionExpanded && book.description.length > 80 && (
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[rgba(var(--bg-primary),1)] to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 标签页 - 更紧凑的间距 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[rgba(var(--border-primary),0.15)]">
        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
            activeTab === 'notes'
              ? 'feather-glass-active text-white'
              : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
          )}
        >
          <StickyNote className="w-3.5 h-3.5" />
          笔记 ({readingNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
            activeTab === 'highlights'
              ? 'feather-glass-active text-white'
              : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
          )}
        >
          <Highlighter className="w-3.5 h-3.5" />
          高亮 ({bookHighlights.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
            activeTab === 'stats'
              ? 'feather-glass-active text-white'
              : 'feather-glass-hover text-[rgba(var(--text-secondary),1)]'
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          统计
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'notes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[rgba(var(--text-primary),1)]">读书笔记</h3>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-4 py-2 feather-glass-button-primary rounded-lg text-sm"
              >
                添加笔记
              </button>
            </div>
            {readingNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="w-12 h-12 text-[rgba(var(--text-tertiary),1)] mx-auto mb-3" />
                <p className="text-[rgba(var(--text-secondary),1)]">还没有笔记</p>
              </div>
            ) : (
              <div className="space-y-4">
                {readingNotes.map((note) => (
                  <div key={note.id} className="p-4 feather-glass-deco rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-[rgba(var(--text-secondary),1)]">
                        {note.chapter && <span>{note.chapter}</span>}
                        {note.page_number && <span>第{note.page_number}页</span>}
                        <span>·</span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => deleteReadingNote(note.id)}
                        className="text-[rgba(var(--color-error),0.8)] hover:text-[rgba(var(--color-error),1)] text-sm"
                      >
                        删除
                      </button>
                    </div>
                    <p className="text-[rgba(var(--text-primary),1)] whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'highlights' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[rgba(var(--text-primary),1)]">高亮句子</h3>
              <button
                onClick={() => setShowHighlightModal(true)}
                className="px-4 py-2 feather-glass-button-primary rounded-lg text-sm"
              >
                添加高亮
              </button>
            </div>
            {bookHighlights.length === 0 ? (
              <div className="text-center py-12">
                <Highlighter className="w-12 h-12 text-[rgba(var(--text-tertiary),1)] mx-auto mb-3" />
                <p className="text-[rgba(var(--text-secondary),1)]">还没有高亮</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className={cn(
                      'p-4 rounded-lg border-l-4 feather-glass-content',
                      highlight.color === 'yellow' && 'border-yellow-400',
                      highlight.color === 'green' && 'border-green-400',
                      highlight.color === 'blue' && 'border-blue-400',
                      highlight.color === 'red' && 'border-red-400',
                      highlight.color === 'purple' && 'border-purple-400'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-[rgba(var(--text-secondary),1)]">
                        {highlight.page_number && <span>第{highlight.page_number}页</span>}
                      </div>
                      <button
                        onClick={() => deleteBookHighlight(highlight.id)}
                        className="text-[rgba(var(--color-error),0.8)] hover:text-[rgba(var(--color-error),1)] text-sm"
                      >
                        删除
                      </button>
                    </div>
                    <p className="text-[rgba(var(--text-primary),1)] font-medium italic">
                      "{highlight.text}"
                    </p>
                    {highlight.notes && (
                      <p className="mt-2 text-sm text-[rgba(var(--text-secondary),1)]">
                        {highlight.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="feather-glass-deco rounded-lg p-4">
              <p className="text-sm text-[rgba(var(--text-secondary),1)] mb-2">开始阅读</p>
              <p className="text-lg font-semibold text-[rgba(var(--text-primary),1)]">
                {book.start_date ? new Date(book.start_date).toLocaleDateString() : '未开始'}
              </p>
            </div>
            <div className="feather-glass-deco rounded-lg p-4">
              <p className="text-sm text-[rgba(var(--text-secondary),1)] mb-2">完成阅读</p>
              <p className="text-lg font-semibold text-[rgba(var(--text-primary),1)]">
                {book.finish_date ? new Date(book.finish_date).toLocaleDateString() : '未完成'}
              </p>
            </div>
            <div className="feather-glass-deco rounded-lg p-4">
              <p className="text-sm text-[rgba(var(--text-secondary),1)] mb-2">笔记数量</p>
              <p className="text-lg font-semibold text-[rgba(var(--text-primary),1)]">
                {readingNotes.length}
              </p>
            </div>
            <div className="feather-glass-deco rounded-lg p-4">
              <p className="text-sm text-[rgba(var(--text-secondary),1)] mb-2">高亮数量</p>
              <p className="text-lg font-semibold text-[rgba(var(--text-primary),1)]">
                {bookHighlights.length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 模态框 */}
      <CreateNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleAddNote}
        currentPage={currentPage}
      />
      <CreateHighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        onSave={handleAddHighlight}
        currentPage={currentPage}
      />
    </div>
  );
};
