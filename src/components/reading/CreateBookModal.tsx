import React, { useState } from 'react';
import { X, Upload, Link, Loader2 } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { cn } from '@/lib/utils';
import type { BookCreate, BookStatus } from '@/types/book';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBookModal: React.FC<CreateBookModalProps> = ({ isOpen, onClose }) => {
  const { createBook, fetchDoubanBook } = useBookStore();
  const [activeTab, setActiveTab] = useState<'manual' | 'douban'>('manual');
  const [doubanUrl, setDoubanUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState<
    BookCreate & {
      cover?: string;
      publisher?: string;
      publish_date?: string;
    }
  >({
    title: '',
    author: '',
    isbn: '',
    status: 'wanted',
    total_pages: undefined,
    current_page: 0,
    rating: undefined,
    tags: [],
    description: '',
    cover: undefined,
    publisher: undefined,
    publish_date: undefined,
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('请输入书名');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBook(formData);
      onClose();
      // 重置表单
      setFormData({
        title: '',
        author: '',
        isbn: '',
        status: 'wanted',
        total_pages: undefined,
        current_page: 0,
        rating: undefined,
        tags: [],
        description: '',
        cover: undefined,
        publisher: undefined,
        publish_date: undefined,
      });
      setTagInput('');
    } catch (error) {
      console.error('Failed to create book:', error);
      alert('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加标签
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...(formData.tags || []), tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div className="feather-glass-modal-backdrop" onClick={onClose} />

      {/* 模态框内容容器 */}
      <div className="fixed inset-0 z-[9001] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-4xl max-h-[90vh] feather-glass-modal rounded-xl shadow-2xl overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b theme-border">
            <h2 className="text-xl font-semibold theme-text-primary">添加新书</h2>
            <button
              onClick={onClose}
              className="p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 theme-text-primary" />
            </button>
          </div>

          {/* 标签页 */}
          <div className="flex border-b theme-border">
            <button
              onClick={() => setActiveTab('manual')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'manual'
                  ? 'theme-text-primary border-b-2 border-blue-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              )}
            >
              手动录入
            </button>
            <button
              onClick={() => setActiveTab('douban')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'douban'
                  ? 'theme-text-primary border-b-2 border-blue-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              )}
            >
              豆瓣导入
            </button>
          </div>

          {/* 豆瓣导入 */}
          {activeTab === 'douban' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">
                  豆瓣图书链接
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={doubanUrl}
                    onChange={(e) => setDoubanUrl(e.target.value)}
                    placeholder="例如：https://book.douban.com/subject/49130647/"
                    className="flex-1 px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isFetching}
                  />
                  <button
                    onClick={async () => {
                      if (!doubanUrl.trim()) {
                        alert('请输入豆瓣图书链接');
                        return;
                      }

                      setIsFetching(true);
                      try {
                        const bookInfo = await fetchDoubanBook(doubanUrl);

                        // 填充表单数据
                        setFormData({
                          title: bookInfo.title || '',
                          author: bookInfo.author || '',
                          isbn: bookInfo.isbn || '',
                          status: 'wanted',
                          total_pages: bookInfo.pages || undefined,
                          current_page: 0,
                          rating: bookInfo.rating ? Math.round(bookInfo.rating) : undefined,
                          tags: bookInfo.tags || [],
                          description: bookInfo.description || '',
                          cover: bookInfo.cover_url || undefined,
                          publisher: bookInfo.publisher || undefined,
                          publish_date: bookInfo.publish_date || undefined,
                        });

                        // 切换到手动编辑标签页
                        setActiveTab('manual');
                        setDoubanUrl('');
                      } catch (error) {
                        console.error('Failed to fetch Douban book:', error);
                        alert('获取豆瓣图书信息失败，请检查链接是否正确');
                      } finally {
                        setIsFetching(false);
                      }
                    }}
                    className="px-4 py-2 theme-button-primary rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={isFetching || !doubanUrl.trim()}
                    type="button"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        获取中...
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        获取信息
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs theme-text-tertiary">
                  支持豆瓣图书页面链接，粘贴链接后点击获取信息
                </p>
              </div>

              {!isFetching && (
                <div className="flex flex-col items-center justify-center py-12 theme-text-tertiary">
                  <Link className="w-16 h-16 mb-4" />
                  <p className="text-sm">输入豆瓣图书链接，自动获取书籍信息</p>
                  <p className="text-xs mt-2">支持格式：https://book.douban.com/subject/xxxxx/</p>
                </div>
              )}
            </div>
          )}

          {/* 手动录入表单 */}
          {activeTab === 'manual' && (
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]"
            >
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    书名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    作者
                  </label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn || ''}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    总页数
                  </label>
                  <input
                    type="number"
                    value={formData.total_pages || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, total_pages: Number(e.target.value) || undefined })
                    }
                    min={0}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 状态选择 */}
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">状态</label>
                <div className="flex gap-4">
                  {(['wanted', 'reading', 'finished'] as BookStatus[]).map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as BookStatus })
                        }
                        className="w-4 h-4"
                      />
                      <span className="theme-text-primary">
                        {status === 'wanted' && '想读'}
                        {status === 'reading' && '在读'}
                        {status === 'finished' && '已读'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 当前页数（仅在"在读"状态显示） */}
              {formData.status === 'reading' && (
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    当前页数
                  </label>
                  <input
                    type="number"
                    value={formData.current_page || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, current_page: Number(e.target.value) || 0 })
                    }
                    min={0}
                    max={formData.total_pages || undefined}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 评分 */}
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={cn(
                        'p-1 rounded transition-colors',
                        star <= (formData.rating || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      )}
                    >
                      ★
                    </button>
                  ))}
                  {formData.rating && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: undefined })}
                      className="ml-2 text-sm theme-text-secondary hover:theme-text-primary"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">标签</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="输入标签后按回车添加"
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 theme-bg-tertiary theme-text-secondary rounded-full flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 简介 */}
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">简介</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* 出版信息（如果从豆瓣导入） */}
              {(formData.publisher || formData.publish_date) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.publisher && (
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1">
                        出版社
                      </label>
                      <input
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  {formData.publish_date && (
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1">
                        出版日期
                      </label>
                      <input
                        type="text"
                        value={formData.publish_date}
                        onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                        className="w-full px-3 py-2 theme-bg-secondary theme-text-primary rounded-lg border theme-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 封面 */}
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">封面</label>
                {formData.cover ? (
                  <div className="relative">
                    <img
                      src={formData.cover}
                      alt="封面预览"
                      className="w-32 h-44 object-cover rounded-lg border theme-border"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover: undefined })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-32 theme-bg-secondary rounded-lg border-2 border-dashed theme-border cursor-pointer hover:theme-bg-tertiary transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 theme-text-tertiary mx-auto mb-2" />
                      <p className="text-sm theme-text-secondary">点击上传封面图片</p>
                      <p className="text-xs theme-text-tertiary mt-1">（或从豆瓣导入）</p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 theme-bg-secondary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 theme-button-primary rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
