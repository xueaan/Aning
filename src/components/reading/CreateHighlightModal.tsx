import React, { useState } from 'react';
import { X, Highlighter, Palette, StickyNote, BookOpen, Hash, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HighlightColor } from '@/types/book';

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (highlight: {
    text: string;
    page_number?: number;
    color: HighlightColor;
    notes?: string;
  }) => void;
  currentPage?: number;
}

export const CreateHighlightModal: React.FC<CreateHighlightModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPage,
}) => {
  const [text, setText] = useState('');
  const [pageNumber, setPageNumber] = useState(currentPage || 0);
  const [color, setColor] = useState<HighlightColor>('yellow');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const colors: {
    value: HighlightColor;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'yellow',
      label: '重点',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      value: 'green',
      label: '理解',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      value: 'blue',
      label: '参考',
      icon: <Hash className="w-4 h-4" />,
    },
    {
      value: 'red',
      label: '警示',
      icon: <Highlighter className="w-4 h-4" />,
    },
    {
      value: 'purple',
      label: '灵感',
      icon: <Palette className="w-4 h-4" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSave({
      text: text.trim(),
      page_number: pageNumber > 0 ? pageNumber : undefined,
      color,
      notes: notes.trim() || undefined,
    });

    // 重置表单
    setText('');
    setPageNumber(currentPage || 0);
    setColor('yellow');
    setNotes('');
    setShowNotes(false);
    onClose();
  };

  if (!isOpen) return null;

  const selectedColor = colors.find((c) => c.value === color);

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
                <Highlighter className="w-5 h-5 lg:w-6 lg:h-6 text-[rgba(var(--color-accent),1)]" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-[rgba(var(--text-primary),1)]">
                  添加高亮
                </h2>
                <p className="text-xs text-[rgba(var(--text-secondary),0.7)] mt-0.5">
                  标记重要内容，随时回顾
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
                {/* 高亮文本 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                    <BookOpen className="w-3.5 h-3.5" />
                    高亮文本
                    <span className="text-red-400 text-xs">*</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="输入或粘贴要高亮的文本..."
                    rows={5}
                    required
                    className="w-full px-3 py-2.5 feather-glass-input text-[rgba(var(--text-primary),1)]
                             rounded-lg border border-[rgba(var(--border-primary),0.2)]
                             focus:outline-none focus:border-[rgba(var(--color-accent),0.4)]
                             focus:ring-2 focus:ring-[rgba(var(--color-accent),0.1)]
                             resize-none text-sm leading-relaxed transition-all"
                  />
                </div>

                {/* 页码输入 */}
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
                    placeholder="输入页码"
                    className="w-full sm:w-40 px-3 py-2 feather-glass-input text-[rgba(var(--text-primary),1)]
                             rounded-lg border border-[rgba(var(--border-primary),0.2)]
                             focus:outline-none focus:border-[rgba(var(--color-accent),0.4)]
                             focus:ring-2 focus:ring-[rgba(var(--color-accent),0.1)]
                             text-sm transition-all"
                  />
                </div>

                {/* 颜色选择器 - 精简设计 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                    <Palette className="w-3.5 h-3.5" />
                    选择标记颜色
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={cn(
                          'px-3 py-2 rounded-lg transition-all duration-200',
                          'border border-[rgba(var(--border-primary),0.2)]',
                          'flex items-center gap-2',
                          color === c.value
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
                        <div
                          className={cn(
                            'w-4 h-4 rounded',
                            c.value === 'yellow' && 'bg-yellow-400',
                            c.value === 'green' && 'bg-green-400',
                            c.value === 'blue' && 'bg-blue-400',
                            c.value === 'red' && 'bg-red-400',
                            c.value === 'purple' && 'bg-purple-400'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium',
                            color === c.value
                              ? 'text-[rgba(var(--text-primary),1)]'
                              : 'text-[rgba(var(--text-secondary),0.9)]'
                          )}
                        >
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 备注 - 可折叠 */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]
                             hover:text-[rgba(var(--color-accent),1)] transition-colors"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    添加备注
                    <span className="text-xs text-[rgba(var(--text-secondary),0.5)]">(可选)</span>
                    <svg
                      className={cn(
                        'w-3.5 h-3.5 ml-auto transition-transform',
                        showNotes ? 'rotate-180' : ''
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showNotes && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="为这段高亮添加备注或想法..."
                      rows={3}
                      className="w-full px-3 py-2.5 feather-glass-input text-[rgba(var(--text-primary),1)]
                               rounded-lg border border-[rgba(var(--border-primary),0.2)]
                               focus:outline-none focus:border-[rgba(var(--color-accent),0.4)]
                               focus:ring-2 focus:ring-[rgba(var(--color-accent),0.1)]
                               resize-none text-sm leading-relaxed transition-all animate-slideDown"
                    />
                  )}
                </div>

                {/* 实时预览 - 精简版 */}
                {text && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="flex items-center gap-2 text-sm font-medium text-[rgba(var(--text-secondary),1)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      预览效果
                    </label>
                    <div
                      className={cn(
                        'p-4 rounded-lg border-l-4 transition-all',
                        'feather-glass-content border-[rgba(var(--border-primary),0.2)]',
                        color === 'yellow' && 'border-l-yellow-400',
                        color === 'green' && 'border-l-green-400',
                        color === 'blue' && 'border-l-blue-400',
                        color === 'red' && 'border-l-red-400',
                        color === 'purple' && 'border-l-purple-400'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            color === 'yellow' && 'bg-yellow-400/20',
                            color === 'green' && 'bg-green-400/20',
                            color === 'blue' && 'bg-blue-400/20',
                            color === 'red' && 'bg-red-400/20',
                            color === 'purple' && 'bg-purple-400/20'
                          )}
                        >
                          {selectedColor?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[rgba(var(--text-primary),0.9)] font-medium leading-relaxed italic break-words">
                            "{text}"
                          </p>
                          {notes && (
                            <div className="mt-2 pt-2 border-t border-[rgba(var(--border-primary),0.1)]">
                              <p className="text-xs text-[rgba(var(--text-secondary),0.8)] italic">
                                {notes}
                              </p>
                            </div>
                          )}
                          {pageNumber > 0 && (
                            <div className="mt-2 text-xs text-[rgba(var(--text-secondary),0.6)]">
                              页码：{pageNumber}
                            </div>
                          )}
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
              disabled={!text.trim()}
              className="px-5 py-2 text-sm feather-glass-button-primary
                       rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
            >
              保存高亮
            </button>
          </div>
        </div>
      </div>

      {/* 添加动画样式 */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
