import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { NovelEditor, type NovelEditorRef } from '@/components/editor/Novel';

interface NoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  initialTitle?: string;
  initialContent?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export const NoteEditModal: React.FC<NoteEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle = '',
  initialContent = '',
  theme = 'dark'
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<NovelEditorRef>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  useEffect(() => {
    if (isOpen) {
      // 延迟聚焦以确保编辑器已渲染
      setTimeout(() => {
        editorRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('请输入内容后再保存');
      return;
    }

    setIsSaving(true);
    try {
      const finalTitle = title.trim() ||
        content.split('\n')[0].substring(0, 50) ||
        '无标题笔记';

      await onSave(finalTitle, content.trim());

      // 清空状态
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };


    if (!isOpen) return null;

    return (
      <div className="feather-glass-modal-backdrop"
        onClick={onClose}
      >
        {/* 模态框内容 */}
        <div className="feather-glass-modal w-full max-w-4xl max-h-[80vh] flex flex-col rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b theme-border-primary">
            <h2 className="text-lg font-semibold theme-text-primary">
              {initialTitle ? '编辑笔记' : '新建笔记'}
            </h2>
            <button onClick={onClose}
              className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-tertiary transition-colors feather-glass-nav"
            title="关闭 (ESC)"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 标题输入 */}
          <input type="text"
            value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题（可选）"
          
            className="w-full px-3 py-2 rounded-lg text-sm outline-none feather-glass-content theme-text-primary placeholder:theme-text-tertiary"
          />

          {/* 内容编辑器 */}
          <div className="min-h-[300px] border rounded-lg theme-card-glass">
            <NovelEditor ref={editorRef} value={content}
            onChange={setContent} onSave={handleSave}
            placeholder="开始写点什么..."
            height={350} theme={theme}
            
            className="w-full p-2"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t theme-border-primary">
          <div className="text-xs theme-text-tertiary">
            <span>Ctrl+Enter 保存</span>
            <span className="mx-2">·</span>
            <span>ESC 关闭</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={isSaving}
            
              className="px-4 py-1.5 rounded-lg text-sm font-medium theme-text-secondary hover:theme-text-primary hover:theme-bg-tertiary transition-colors feather-glass-nav"
            >
            取消
          </button>
          <button onClick={handleSave} disabled={!content.trim() || isSaving}
          
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${content.trim() && !isSaving
              ? 'theme-bg-accent theme-text-on-accent hover:theme-bg-accent-hover shadow-sm'
              : 'theme-bg-disabled theme-text-disabled cursor-not-allowed'
            }`}
            >
          {isSaving ? '保存中...' : '保存笔记'}
          </button>
          </div>
        </div>
    </div>
    </div>
  );
};










