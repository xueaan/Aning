import React, { useState } from 'react';
import { X, StickyNote, BookOpen, Hash, Tag, FileText, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteType } from '@/types/book';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: {
    chapter?: string;
    page_number?: number;
    content: string;
    note_type: NoteType;
  }) => void;
  currentPage?: number;
}

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPage,
}) => {
  const [chapter, setChapter] = useState('');
  const [pageNumber, setPageNumber] = useState(currentPage || 0);
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('note');

  const noteTypes: {
    value: NoteType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      value: 'note',
      label: '笔记',
      description: '读书笔记',
      icon: <PenTool className="w-5 h-5" />,
      color: 'blue',
    },
    {
      value: 'thought',
      label: '想法',
      description: '个人感悟',
      icon: <StickyNote className="w-5 h-5" />,
      color: 'purple',
    },
    {
      value: 'summary',
      label: '总结',
      description: '章节总结',
      icon: <FileText className="w-5 h-5" />,
      color: 'green',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSave({
      chapter: chapter.trim() || undefined,
      page_number: pageNumber > 0 ? pageNumber : undefined,
      content: content.trim(),
      note_type: noteType,
    });

    // 重置表单
    setChapter('');
    setPageNumber(currentPage || 0);
    setContent('');
    setNoteType('note');
    onClose();
  };

  if (!isOpen) return null;

  const selectedType = noteTypes.find((t) => t.value === noteType);

  return (
    <>
      {/* 背景遮罩 */}
      <div className="feather-glass-modal-backdrop" onClick={onClose} />

      {/* 模态框内容容器 */}
      <div className="fixed inset-0 z-[9001] flex items-center justify-center pointer-events-none p-4">
        <div className="pointer-events-auto w-full max-w-4xl feather-glass-modal rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
          {/* 头部 */}
          <div className="flex items-center justify-between p-5 lg:p-6 border-b border-[rgba(var(--border-primary),0.15)]">
            <div className="flex items-center gap-3">
              <div className="p-2 feather-glass-deco rounded-lg">
                <StickyNote className="w-5 h-5 lg:w-6 lg:h-6 text-[rgba(var(--color-accent),1)]" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-[rgba(var(--text-primary),1)]">
                  添加读书笔记
                </h2>
                <p className="text-xs text-[rgba(var(--text-secondary),0.7)] mt-0.5">
                  记录你的思考和感悟
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 feather-glass-nav rounded-lg hover:feather-glass-hover transition-all"
            >
              <X className="w-4 h-4 text-[rgba(var(--text-secondary),1)]" />
            </button>
          </div>

          {/* 表单内容 - 可滚动区域 */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-5 lg:p-6">
              <div className="space-y-5">
                {/* 笔记类型选择 - 精简设计 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                    <Tag className="w-3.5 h-3.5" />
                    笔记类型
                  </label>
                  <div className="flex gap-2">
                    {noteTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNoteType(type.value)}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg transition-all duration-200',
                          'border border-[rgba(var(--border-primary),0.2)]',
                          'flex items-center justify-center gap-2',
                          noteType === type.value
                            ? [
                                'feather-glass-active',
                                'ring-1 ring-[rgba(var(--color-accent),0.3)]',
                                'border-[rgba(var(--color-accent),0.4)]',
                              ]
                            : [
                                'feather-glass-content',
                                'hover:feather-glass-hover',
                                'hover:border-[rgba(var(--border-primary),0.3)]',
                              ]
                        )}
                      >
                        <span
                          className={cn(
                            'transition-colors',
                            noteType === type.value
                              ? 'text-[rgba(var(--color-accent),1)]'
                              : 'text-[rgba(var(--text-secondary),0.8)]'
                          )}
                        >
                          {type.icon}
                        </span>
                        <div className="text-left">
                          <div
                            className={cn(
                              'text-sm font-medium',
                              noteType === type.value
                                ? 'text-[rgba(var(--text-primary),1)]'
                                : 'text-[rgba(var(--text-secondary),0.9)]'
                            )}
                          >
                            {type.label}
                          </div>
                          <div className="text-xs text-[rgba(var(--text-secondary),0.6)]">
                            {type.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 章节和页码 - 紧凑布局 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                      <BookOpen className="w-3.5 h-3.5" />
                      章节名称
                      <span className="text-xs text-[rgba(var(--text-secondary),0.5)]">(可选)</span>
                    </label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="如：第一章"
                      className="w-full px-3 py-2 feather-glass-input text-[rgba(var(--text-primary),1)]
                               rounded-lg border border-[rgba(var(--border-primary),0.2)]
                               focus:outline-none focus:border-[rgba(var(--color-accent),0.4)]
                               focus:ring-2 focus:ring-[rgba(var(--color-accent),0.1)]
                               text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                      <Hash className="w-3.5 h-3.5" />
                      页码位置
                      <span className="text-xs text-[rgba(var(--text-secondary),0.5)]">(可选)</span>
                    </label>
                    <input
                      type="number"
                      value={pageNumber}
                      onChange={(e) => setPageNumber(Number(e.target.value))}
                      min={0}
                      placeholder="页码"
                      className="w-full px-3 py-2 feather-glass-input text-[rgba(var(--text-primary),1)]
                               rounded-lg border border-[rgba(var(--border-primary),0.2)]
                               focus:outline-none focus:border-[rgba(var(--color-accent),0.4)]
                               focus:ring-2 focus:ring-[rgba(var(--color-accent),0.1)]
                               text-sm transition-all"
                    />
                  </div>
                </div>

                {/* 笔记内容 - 主要输入区域 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                    <PenTool className="w-3.5 h-3.5" />
                    笔记内容
                    <span className="text-red-400 text-xs">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      noteType === 'note'
                        ? '记录书中的重要内容...'
                        : noteType === 'thought'
                          ? '写下你的感悟和思考...'
                          : '总结本章节的核心要点...'
                    }
                    rows={8}
                    required
                    className="w-full px-3 py-2.5 feather-glass-input text-[rgba(var(--text-primary),1)]
                             rounded-lg border border-[rgba(var(--border-primary),0.2)]
                             focus:outline-none focus:border-[rgba(var(--color-accent),0.4)]
                             focus:ring-2 focus:ring-[rgba(var(--color-accent),0.1)]
                             resize-none text-sm leading-relaxed transition-all"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgba(var(--text-secondary),0.5)]">
                      支持 Markdown 格式
                    </span>
                    <span className="text-xs text-[rgba(var(--text-secondary),0.5)]">
                      {content.length} 字
                    </span>
                  </div>
                </div>

                {/* 实时预览 - 精简版 */}
                {content && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                      <FileText className="w-3.5 h-3.5" />
                      预览
                    </label>
                    <div className="p-4 rounded-lg feather-glass-content border border-[rgba(var(--border-primary),0.2)]">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'p-1.5 rounded-md flex-shrink-0',
                            'bg-[rgba(var(--color-accent),0.1)]'
                          )}
                        >
                          {selectedType?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium
                                         bg-[rgba(var(--color-accent),0.15)]
                                         text-[rgba(var(--color-accent),1)]"
                            >
                              {selectedType?.label}
                            </span>
                            {chapter && (
                              <span className="text-xs text-[rgba(var(--text-secondary),0.7)]">
                                {chapter}
                              </span>
                            )}
                            {pageNumber > 0 && (
                              <span className="text-xs text-[rgba(var(--text-secondary),0.5)]">
                                第 {pageNumber} 页
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[rgba(var(--text-primary),0.9)] leading-relaxed whitespace-pre-wrap break-words">
                            {content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* 底部按钮 - 固定在底部 */}
          <div className="flex justify-end gap-2 p-5 lg:p-6 border-t border-[rgba(var(--border-primary),0.15)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[rgba(var(--text-secondary),1)]
                       hover:text-[rgba(var(--text-primary),1)] feather-glass-nav
                       rounded-lg transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="px-5 py-2 text-sm feather-glass-button-primary
                       rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
            >
              保存笔记
            </button>
          </div>
        </div>
      </div>

      {/* 添加动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
