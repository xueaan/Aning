import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Tag, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Card as CardType } from '@/stores';
import { NovelEditor, type NovelEditorRef } from '@/components/editor/Novel';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { debounce } from '@/utils/debounce';

interface CardExpandedViewProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string, updates: Partial<CardType>) => Promise<void>;
  onDelete?: (card: CardType) => void;
}

export const CardExpandedView: React.FC<CardExpandedViewProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const editorRef = useRef<NovelEditorRef>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // 初始化数据
  useEffect(() => {
    if (card && isOpen) {
      setTitle(card.title || '');
      setContent(card.content || '');
      setTags(card.tags || []);
      setTagInput('');
      setHasChanges(false);
    }
  }, [card, isOpen]);

  // 监听内容变化
  useEffect(() => {
    if (card) {
      const titleChanged = title !== card.title;
      const contentChanged = content !== card.content;
      const tagsChanged = JSON.stringify(tags) !== JSON.stringify(card.tags);
      setHasChanges(titleChanged || contentChanged || tagsChanged);
    }
  }, [title, content, tags, card]);

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 保存笔记
  const handleSave = async () => {
    if (!card || !hasChanges) return;

    setIsLoading(true);
    try {
      await onSave(card.id, {
        title: title.trim(),
        content: content,
        tags: tags.length > 0 ? tags : undefined
      });
      setHasChanges(false);
    } catch (error) {
      console.error('保存失败:', error);
      // 这里可以添加错误提示
    } finally {
      setIsLoading(false);
    }
  };

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 处理标签输入
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 更新工具栏活跃状态
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;

    const formats: string[] = [];
    const editor = editorRef.current;

    // 检查文本格式
    if (editor.isActive('bold')) formats.push('bold');
    if (editor.isActive('italic')) formats.push('italic');
    if (editor.isActive('strike')) formats.push('strike');
    if (editor.isActive('code')) formats.push('code');

    // 检查标题级别
    if (editor.isActive('heading', { level: 1 })) formats.push('heading1');
    if (editor.isActive('heading', { level: 2 })) formats.push('heading2');
    if (editor.isActive('heading', { level: 3 })) formats.push('heading3');

    // 检查段落
    if (editor.isActive('paragraph')) formats.push('paragraph');

    // 检查对齐
    if (editor.isActive('textAlign', { textAlign: 'left' })) formats.push('left');
    if (editor.isActive('textAlign', { textAlign: 'center' })) formats.push('center');
    if (editor.isActive('textAlign', { textAlign: 'right' })) formats.push('right');

    // 检查列表和块
    if (editor.isActive('bullet')) formats.push('bullet');
    if (editor.isActive('ordered')) formats.push('ordered');
    if (editor.isActive('blockquote')) formats.push('blockquote');
    if (editor.isActive('codeBlock')) formats.push('codeBlock');

    setActiveFormats(formats);
  }, []);

  // 防抖更新活跃格式
  const debouncedUpdateFormats = useCallback(
    debounce(() => {
      updateActiveFormats();
    }, 100),
    [updateActiveFormats]
  );

  // 处理工具栏格式化
  const handleFormat = (format: string) => {
    if (!editorRef.current) return;

    switch (format) {
      case 'bold':
        editorRef.current.toggleBold();
        break;
      case 'italic':
        editorRef.current.toggleItalic();
        break;
      case 'strike':
        editorRef.current.toggleStrike();
        break;
      case 'code':
        editorRef.current.toggleCode();
        break;
      case 'heading1':
        editorRef.current.toggleHeading(1);
        break;
      case 'heading2':
        editorRef.current.toggleHeading(2);
        break;
      case 'heading3':
        editorRef.current.toggleHeading(3);
        break;
      case 'paragraph':
        editorRef.current.setParagraph();
        break;
      case 'left':
        editorRef.current.setTextAlign('left');
        break;
      case 'center':
        editorRef.current.setTextAlign('center');
        break;
      case 'right':
        editorRef.current.setTextAlign('right');
        break;
      case 'bullet':
        editorRef.current.toggleBullet();
        break;
      case 'ordered':
        editorRef.current.toggleOrdered();
        break;
      case 'blockquote':
        editorRef.current.toggleBlockquote();
        break;
      case 'codeBlock':
        editorRef.current.toggleCodeBlock();
        break;
      default:
        console.warn('Unknown format:', format);
    }
  };

  // 处理编辑器内容变化
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // 更新工具栏状态
    debouncedUpdateFormats();
  };

  // 关闭确认
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('有未保存的更改，确定要关闭吗？');
      if (!confirmed) return;
    }
    onClose();
  };

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // ESC 关闭
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges]);

  if (!card) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* 主内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <div className="w-full max-w-5xl h-full rounded-3xl flex flex-col overflow-hidden shadow-2xl feather-glass-deco">
              {/* 头部工具栏 */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  {/* 笔记状态指示 */}
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" 
                        title="有未保存的更改" 
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm theme-text-tertiary">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>创建于 {formatDate(card.created_at)}</span>
                    </div>
                    {card.updated_at !== card.created_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>更新于 {formatDate(card.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                      if (window.confirm('确定要删除这篇笔记吗？')) {
                        onDelete?.(card);
                        onClose();
                      }
                    }}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="w-px h-6 theme-bg-tertiary mx-2" />

                  <button onClick={handleSave} disabled={!hasChanges || isLoading}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                      hasChanges && !isLoading
                        ? 'theme-button-primary'
                        : 'bg-white/10 theme-text-tertiary cursor-not-allowed'
                    )}
                  >
                    <Save size={16} />
                    {isLoading ? '保存中...' : '保存'}
                  </button>

                  <button onClick={handleClose}
                    className="p-2 rounded-lg hover:theme-bg-tertiary transition-colors theme-text-secondary"
                    title="关闭 (ESC)"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 标题编辑 */}
                <div className="p-6 border-b border-white/10">
                  <input type="text"
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="笔记标题..."
                    className="w-full text-2xl font-bold theme-text-primary bg-transparent border-none outline-none placeholder-gray-400"
                  />
                </div>
                <div className="px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={16} className="theme-text-secondary" />
                    <span className="text-sm font-medium theme-text-secondary">
                      标签
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag, index) => (
                      <span key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-white/10 theme-text-secondary rounded-full"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="添加标签..."
                      className="flex-1 px-3 py-2 text-sm theme-input rounded-lg"
                    />
                    <button onClick={handleAddTag} disabled={!tagInput.trim()}
                      className="px-4 py-2 text-sm bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="h-full rounded-xl overflow-hidden feather-glass-deco">
                    {/* 工具栏 */}
                    <div className="p-3 pb-2">
                      <EditorToolbar onFormat={handleFormat}
                        activeFormats={activeFormats}
                        className="w-fit"
                      />
                    </div>
                    <div className="flex-1 px-3 pb-3">
                      <div className="h-full rounded-lg overflow-hidden bg-white/10 border border-white/10">
                        <NovelEditor ref={editorRef}
                          value={content}
                          onChange={handleContentChange}
                          placeholder="在这里记录你的想法..."
                          className="h-full"
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};







