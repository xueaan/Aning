import { useImperativeHandle, forwardRef, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { getNotionExtensions } from './extensions';
import { SlashCommandMenu } from './components/SlashCommandMenu';
import { NotionFloatingMenu } from './components/NotionFloatingMenu';
import { NotionBubbleMenu } from './components/NotionBubbleMenu';
import { NotionContextMenu } from './components/NotionContextMenu';
import { processImageUpload } from '@/utils/imageUtils';
import './styles/notion.css';

// 编辑器引用接口 - 保持与现有系统兼容
export interface NotionEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
  getHTML: () => string;
  getMarkdown: () => string;
  focus: () => void;
  blur: () => void;
  insertText: (text: string) => void;
  undo: () => void;
  redo: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  toggleCode: () => void;
  toggleHeading: (level: 1 | 2 | 3) => void;
  setParagraph: () => void;
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleBullet: () => void;
  toggleOrdered: () => void;
  toggleBlockquote: () => void;
  toggleCodeBlock: () => void;
  isActive: (name: string, attrs?: any) => boolean;
  insertImage: (src: string) => void;
  getEditor: () => Editor | null;
}

export interface NotionEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  height?: number;
}

const NotionEditor = forwardRef<NotionEditorRef, NotionEditorProps>(
  ({ value = '', onChange, onSave, placeholder = '输入 "/" 查看命令，或开始输入...', readOnly = false, className = '', theme = 'light', height }, ref) => {
    const [, setContent] = useState(value);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 初始化编辑器
    const editor = useEditor({
      extensions: getNotionExtensions({
        placeholder,
        onSlashCommand: (pos) => {
          // 计算相对于编辑器容器的位置
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setSlashMenuPos({
              top: pos.top - containerRect.top + 24,
              left: pos.left - containerRect.left,
            });
            setShowSlashMenu(true);
          }
        },
        onCloseSlashCommand: () => {
          setShowSlashMenu(false);
        }
      }),
      content: value,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        setContent(html);
        onChange?.(html);
      },
      editorProps: {
        attributes: {
          class: 'notion-editor-content',
          'data-placeholder': placeholder,
          spellcheck: 'false',
        },
        handleDOMEvents: {
          // 右键菜单
          contextmenu: (view, event) => {
            event.preventDefault();
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (pos && containerRef.current) {
              const node = view.state.doc.nodeAt(pos.pos);
              const containerRect = containerRef.current.getBoundingClientRect();
              setSelectedNode(node);
              setContextMenuPos({
                top: event.clientY - containerRect.top,
                left: event.clientX - containerRect.left,
              });
              setShowContextMenu(true);
            }
            return true;
          },
          // 点击其他地方关闭菜单
          click: () => {
            setShowContextMenu(false);
            return false;
          },
        },
      },
    });

    // 监听 value 变化
    useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value);
      }
    }, [value, editor]);

    // 监听键盘快捷键
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          onSave?.();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [onSave]);

    // 暴露 ref API - 保持与现有系统兼容
    useImperativeHandle(ref, () => ({
      getValue: () => {
        return editor?.getHTML() || '';
      },

      setValue: (newValue: string) => {
        editor?.commands.setContent(newValue);
      },

      getHTML: () => {
        return editor?.getHTML() || '';
      },

      getMarkdown: () => {
        // TODO: 实现 HTML 到 Markdown 的转换
        return editor?.getHTML() || '';
      },

      focus: () => {
        editor?.commands.focus();
      },

      blur: () => {
        editor?.commands.blur();
      },

      insertText: (text: string) => {
        editor?.chain().focus().insertContent(text).run();
      },

      undo: () => {
        editor?.commands.undo();
      },

      redo: () => {
        editor?.commands.redo();
      },

      toggleBold: () => {
        editor?.chain().focus().toggleMark('bold').run();
      },

      toggleItalic: () => {
        editor?.chain().focus().toggleMark('italic').run();
      },

      toggleStrike: () => {
        editor?.chain().focus().toggleMark('strike').run();
      },

      toggleCode: () => {
        editor?.chain().focus().toggleMark('code').run();
      },

      toggleHeading: (level: 1 | 2 | 3) => {
        editor?.chain().focus().setNode('heading', { level }).run();
      },

      setParagraph: () => {
        editor?.chain().focus().setNode('paragraph').run();
      },

      setTextAlign: (align: 'left' | 'center' | 'right') => {
        editor?.chain().focus().setTextAlign(align).run();
      },

      toggleBulletList: () => {
        editor?.chain().focus().toggleBulletList().run();
      },

      toggleOrderedList: () => {
        editor?.chain().focus().toggleOrderedList().run();
      },

      toggleBullet: () => {
        editor?.chain().focus().toggleBulletList().run();
      },

      toggleOrdered: () => {
        editor?.chain().focus().toggleOrderedList().run();
      },

      toggleBlockquote: () => {
        editor?.chain().focus().toggleNode('blockquote', 'paragraph').run();
      },

      toggleCodeBlock: () => {
        editor?.chain().focus().toggleNode('codeBlock', 'paragraph').run();
      },

      isActive: (name: string, attrs?: any) => {
        return editor?.isActive(name, attrs) || false;
      },

      insertImage: (src: string) => {
        editor?.chain().focus().setImage({ src }).run();
      },

      getEditor: () => {
        return editor;
      },
    }), [editor]);

    // 添加图片处理
    useEffect(() => {
      if (!editor) return;

      const handlePaste = (event: ClipboardEvent) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            processImageUpload(file, {
              quality: 0.8,
              maxWidth: 1920,
              maxHeight: 1080,
              maxSize: 5,
            }).then(base64 => {
              editor.chain().focus().setImage({ src: base64 }).run();
            }).catch(error => {
              console.error('图片上传失败:', error);
            });
          }
        }
      };

      const handleDrop = (event: DragEvent) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            processImageUpload(file, {
              quality: 0.8,
              maxWidth: 1920,
              maxHeight: 1080,
              maxSize: 5,
            }).then(base64 => {
              editor.chain().focus().setImage({ src: base64 }).run();
            }).catch(error => {
              console.error('图片拖拽上传失败:', error);
            });
          }
        }
      };

      const editorElement = editor.view.dom;
      editorElement.addEventListener('paste', handlePaste);
      editorElement.addEventListener('drop', handleDrop);

      return () => {
        editorElement.removeEventListener('paste', handlePaste);
        editorElement.removeEventListener('drop', handleDrop);
      };
    }, [editor]);

    if (!editor) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        className={`notion-editor-container ${className} ${theme === 'dark' ? 'dark' : ''}`}
        style={{ height: height ? `${height}px` : '100%', position: 'relative' }}
      >
        {/* Editor Content */}
        <EditorContent editor={editor} className="notion-editor" />

        {/* Bubble Menu - appears on text selection */}
        {editor && editor.state.selection.from !== editor.state.selection.to && (
          <div className="notion-bubble-menu" style={{ display: 'none' }}>
            <NotionBubbleMenu editor={editor} />
          </div>
        )}

        {/* Floating Menu - appears on empty lines */}
        {editor && (
          <div className="notion-floating-menu" style={{ display: 'none' }}>
            <NotionFloatingMenu editor={editor} />
          </div>
        )}

        {/* Slash Command Menu */}
        {showSlashMenu && (
          <SlashCommandMenu
            editor={editor}
            position={slashMenuPos}
            onClose={() => setShowSlashMenu(false)}
            isInModal={className.includes('modal') || containerRef.current?.closest('.feather-glass-modal') !== null}
          />
        )}

        {/* Context Menu */}
        {showContextMenu && (
          <NotionContextMenu
            editor={editor}
            position={contextMenuPos}
            node={selectedNode}
            onClose={() => setShowContextMenu(false)}
          />
        )}
      </div>
    );
  }
);

NotionEditor.displayName = 'NotionEditor';

// 导出兼容的组件名称
export const NovelEditor = NotionEditor;
export type NovelEditorRef = NotionEditorRef;
export type NovelEditorProps = NotionEditorProps;

export default NotionEditor;