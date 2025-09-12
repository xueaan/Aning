import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NovelEditor, type NovelEditorRef } from '@/components/editor/Novel';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { type Card } from '@/stores';
import { debounce } from '@/utils/debounce';

interface CardEditorModalProps {
  isOpen: boolean;
  card?: Card | null;
  boxId?: string | null;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  className?: string;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  isOpen,
  card,
  boxId,
  onClose,
  onSave,
  className = ''
}) => {
  const editorRef = useRef<NovelEditorRef>(null);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // 初始化编辑器内容
  useEffect(() => {
    if (isOpen) {
      const initialContent = card?.content || '';
      setTitle(card?.title || '');
      setEditorContent(initialContent);
      setHasChanges(false);

      // 延迟设置编辑器内容，确保编辑器已经渲染
      setTimeout(() => {
        if (editorRef.current && initialContent) {
          console.log('设置编辑器内容:', initialContent);
          editorRef.current.setValue(initialContent);
        }
      }, 200);
    }
  }, [isOpen, card]);

  // 监听内容变化
  const handleContentChange = (content: string) => {
    console.log('编辑器内容变化:', content);
    setEditorContent(content);
    setHasChanges(true);
    // 更新工具栏状态
    debouncedUpdateFormats();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  // 保存笔记
  const handleSave = async () => {
    console.log('点击保存按钮！');
    if (!title.trim()) {
      alert('请输入笔记标题');
      return;
    }

    if (!boxId && !card) {
      alert('无法保存：缺少必要信息');
      return;
    }

    try {
      setIsSaving(true);
      // 优先使用状态中的内容，如果没有则尝试从编辑器获取
      const content = editorContent || editorRef.current?.getHTML() || '';
      console.log('保存内容:', { title: title.trim(), content, contentLength: content.length });
      await onSave(title.trim(), content);
      setHasChanges(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 关闭前确认
  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('有未保存的更改，确定要关闭吗？')) {
        onClose();
        setHasChanges(false);
      }
    } else {
      onClose();
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

  // 快捷键处理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges]);

  if (!isOpen) return null;

  console.log('CardEditorModal 渲染状态:', {
    title: title.length,
    hasTitle: title.trim().length > 0,
    isSaving,
    isDisabled: isSaving || !title.trim()
  });

  return (
    <div className="feather-glass-modal modal-glass">
      <div className={cn(
        'rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col',
        className
      )} onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FileText size={20} 
              className="theme-text-secondary" 
            />
            <h2 className="text-lg font-semibold theme-text-primary">
              {card ? '编辑笔记' : '新建笔记'}
            </h2>
            {hasChanges && (
              <div className="w-2 h-2 bg-orange-400 rounded-full" title="有未保存的更改" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => {
                console.log('按钮被点击');
                handleSave();
              }}
              disabled={isSaving || !title.trim()}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
                isSaving || !title.trim()
                  ? 'bg-white/10 theme-text-tertiary cursor-not-allowed'
                  : 'theme-button-primary'
              )}
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存'}
            </button>

            <button onClick={handleClose}
            className="p-2 rounded-md transition-colors"
              title="关闭 (Esc)"
            >
              <X size={18} 
              className="theme-text-secondary" 
            />
            </button>
          </div>
        </div>
        <div className="p-4 border-b border-white/10">
          <input type="text"
            value={title} onChange={handleTitleChange}
            placeholder="输入笔记标题..."
            
            className="w-full text-2xl font-bold theme-text-primary bg-transparent border-none outline-none resize-none placeholder:theme-text-tertiary"
            autoFocus={!card}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="h-full rounded-xl overflow-hidden">
            {/* 工具栏 */}
            <div className="p-3 pb-2">
              <EditorToolbar onFormat={handleFormat} activeFormats={activeFormats}
                
                className="w-fit"
              />
            </div>
            <div className="flex-1 px-3 pb-3">
              <div className="h-full rounded-lg overflow-hidden bg-white/10 border border-white/10">
                <NovelEditor ref={editorRef} value={card?.content || ''}
                  onChange={handleContentChange} placeholder="开始编写笔记内容..."
                  readOnly={false}
                  className="h-full"
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 bg-white/5 border-t border-white/10 text-sm theme-text-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>按 Ctrl+S 保存</span>
              <span>按 Esc 关闭</span>
              <span>支持 Markdown 语法</span>
            </div>
            {card && (
              <div className="text-xs">
                最后更新：{new Date(card.updated_at).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};








