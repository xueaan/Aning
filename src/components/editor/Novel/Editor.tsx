import { useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import {
  EditorRoot,
  EditorContent,
  handleCommandNavigation,
  handleImagePaste,
  handleImageDrop,
  createImageUpload,
  Command,
} from 'novel';
import { suggestionItems } from './slash-command';
import { createCustomRender } from './custom-render';
import { BubbleMenu } from './bubble-menu';
import { defaultExtensions } from './extensions';
import { NovelEditorProps, NovelEditorRef } from './types';
import { processImageUpload, validateImageFile } from '@/utils/imageUtils';
import './styles.css';

// 内部编辑器组件，在EditorRoot 上下文中
const EditorInner = forwardRef<NovelEditorRef, NovelEditorProps>(
  ({ value = '', onChange, onSave, placeholder = '输入 / 查看命令...', readOnly = false }, ref) => {
    const [content, setContent] = useState(value);
    const [editorInstance, setEditorInstance] = useState<any>(null);

    // 创建图片上传处理器
    const imageUploadHandler = createImageUpload({
      validateFn: (file: File) => {
        const error = validateImageFile(file, 5); // 5MB 限制
        if (error) {
          throw new Error(error);
        }
      },
      onUpload: async (file: File) => {
        try {
          // 处理图片：压缩并转换为base64
          const base64 = await processImageUpload(file, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080,
            maxSize: 5,
          });

          return base64; // 返回 base64 数据 URL
        } catch (error) {
          console.error('图片上传处理失败:', error);
          throw error;
        }
      },
    });

    // 监听 value 变化
    useEffect(() => {
      if (value !== content) {
        setContent(value);
      }
    }, [value, content]);

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

    // 暴露 ref API
    useImperativeHandle(
      ref,
      () => ({
        getValue: () => {
          return content;
        },

        setValue: (newValue: string) => {
          // 更新 React 状态
          setContent(newValue);

          // 同步更新编辑器实例内容
          if (editorInstance) {
            // 获取编辑器实例的实际内容
            const editorActualContent = editorInstance.getHTML();

            // 比较新内容与编辑器实际内容（而不是 React 状态）
            if (newValue !== editorActualContent) {
              try {
                // 使用编辑器的 setContent 命令来更新内容
                editorInstance.commands.setContent(newValue);
              } catch (error) {
                console.error('Failed to update editor content:', error);
              }
            }
          }
        },

        focus: () => {
          editorInstance?.commands.focus() ||
            (() => {
              const editor = document.querySelector('.ProseMirror') as HTMLElement;
              editor?.focus();
            })();
        },

        blur: () => {
          const editor = document.querySelector('.ProseMirror') as HTMLElement;
          editor?.blur();
        },

        getHTML: () => {
          return editorInstance?.getHTML() || content;
        },

        getMarkdown: () => {
          return content;
        },

        insertText: (text: string) => {
          editorInstance?.chain().focus().insertContent(text).run();
        },

        undo: () => {
          editorInstance?.chain().focus().undo().run();
        },

        redo: () => {
          editorInstance?.chain().focus().redo().run();
        },

        // 格式化命令
        toggleBold: () => {
          editorInstance?.chain().focus().toggleBold().run();
        },

        toggleItalic: () => {
          editorInstance?.chain().focus().toggleItalic().run();
        },

        toggleStrike: () => {
          editorInstance?.chain().focus().toggleStrike().run();
        },

        toggleCode: () => {
          editorInstance?.chain().focus().toggleCode().run();
        },

        toggleHeading: (level: 1 | 2 | 3) => {
          editorInstance?.chain().focus().toggleHeading({ level }).run();
        },

        setParagraph: () => {
          editorInstance?.chain().focus().setParagraph().run();
        },

        setTextAlign: (align: 'left' | 'center' | 'right') => {
          editorInstance?.chain().focus().setTextAlign(align).run();
        },

        toggleBulletList: () => {
          editorInstance?.chain().focus().toggleBulletList().run();
        },

        toggleOrderedList: () => {
          editorInstance?.chain().focus().toggleOrderedList().run();
        },

        toggleBullet: () => {
          editorInstance?.chain().focus().toggleBulletList().run();
        },

        toggleOrdered: () => {
          editorInstance?.chain().focus().toggleOrderedList().run();
        },

        toggleBlockquote: () => {
          editorInstance?.chain().focus().toggleBlockquote().run();
        },

        toggleCodeBlock: () => {
          editorInstance?.chain().focus().toggleCodeBlock().run();
        },

        isActive: (name: string, attrs?: any) => {
          return editorInstance?.isActive(name, attrs) || false;
        },

        insertImage: (src: string) => {
          editorInstance?.chain().focus().setImage({ src }).run();
        },

        getEditor: () => {
          return editorInstance;
        },
      }),
      [content, editorInstance]
    );

    const handleUpdate = ({ editor }: any) => {
      const html = editor.getHTML();
      setContent(html);
      onChange?.(html);
    };

    const handleCreate = ({ editor }: any) => {
      setEditorInstance(editor);
    };

    const extensions = [
      ...defaultExtensions,
      Command.configure({
        suggestion: {
          char: '/',
          items: ({ query }: { query: string }) => {
            const filtered = suggestionItems.filter(
              (item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.searchTerms?.some((term) => term.toLowerCase().includes(query.toLowerCase()))
            );
            return filtered;
          },
          render: createCustomRender(),
          command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
            if (props.command) {
              props.command({ editor, range });
            }
          },
        },
      }),
    ] as any;

    return (
      <EditorContent
        extensions={extensions}
        initialContent={content as any}
        onUpdate={handleUpdate}
        onCreate={handleCreate}
        className="relative focus:outline-none max-w-full min-h-[300px]"
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
            paste: (view, event) => handleImagePaste(view, event, imageUploadHandler),
            drop: (view, event) => handleImageDrop(view, event, false, imageUploadHandler),
            mousedown: (_view, _event) => {
              return true;
            },
            mouseup: (_view, _event) => {
              return true;
            },
            click: (view, event) => {
              const target = event.target as HTMLElement;

              // 避免与拖拽手柄冲突
              if (target.closest('.drag-handle')) {
                return false;
              }
              const header = target.closest('.callout-header');

              if (header) {
                const callout = target.closest('[data-callout]') as HTMLElement;
                const toggle = target.closest('.callout-toggle');
                const title = target.closest('.callout-title');

                if (callout) {
                  try {
                    let pos = view.posAtDOM(callout, 0);

                    if (pos !== -1) {
                      let node = view.state.doc.nodeAt(pos);

                      // 查找正确的callout 节点位置
                      if (!node || node.type.name !== 'callout') {
                        for (let offset = -10; offset <= 10; offset++) {
                          if (pos + offset >= 0 && pos + offset < view.state.doc.content.size) {
                            const testNode = view.state.doc.nodeAt(pos + offset);
                            if (testNode && testNode.type.name === 'callout') {
                              pos = pos + offset;
                              node = testNode;
                              break;
                            }
                          }
                        }
                      }

                      if (node && node.type.name === 'callout') {
                        let newAttrs;

                        if (toggle) {
                          // 点击了折叠按钮，切换折叠状态
                          const currentCollapsed = node.attrs.collapsed || false;
                          newAttrs = {
                            type: node.attrs.type || 'info',
                            collapsed: !currentCollapsed,
                          };
                        } else if (title) {
                          // 点击了标题，切换callout类型
                          const currentType = node.attrs.type || 'info';
                          const types = ['info', 'note', 'warning', 'tip', 'error'];
                          const currentIndex = types.indexOf(currentType);
                          const nextType = types[(currentIndex + 1) % types.length];

                          newAttrs = {
                            type: nextType,
                            collapsed: node.attrs.collapsed || false,
                          };
                        } else {
                          // 点击了其他区域，默认切换折叠状态
                          const currentCollapsed = node.attrs.collapsed || false;
                          newAttrs = {
                            type: node.attrs.type || 'info',
                            collapsed: !currentCollapsed,
                          };
                        }

                        const tr = view.state.tr.setNodeMarkup(pos, undefined, newAttrs);
                        view.dispatch(tr);

                        return false;
                      }
                    }
                  } catch (error) {
                    // Callout interaction failed silently
                  }
                }
              }

              return false;
            },
          },
          attributes: {
            class: 'font-default focus:outline-none max-w-full p-4',
            'data-placeholder': placeholder,
          },
          editable: () => !readOnly,
        }}
      >
        <BubbleMenu />
      </EditorContent>
    );
  }
);

EditorInner.displayName = 'EditorInner';

// 主编辑器组件
const NovelEditor = forwardRef<NovelEditorRef, NovelEditorProps>((props, ref) => {
  const { className = '', theme = 'light', height } = props;

  const editorClasses = `
    novel-editor 
    ${className}
    ${theme === 'dark' ? 'dark' : ''}
  `.trim();

  return (
    <div
      className={`editor-container ${editorClasses}`}
      style={{ height: height ? `${height}px` : 'auto' }}
    >
      <EditorRoot>
        <EditorInner {...props} ref={ref} />
      </EditorRoot>
    </div>
  );
});

NovelEditor.displayName = 'NovelEditor';

export default NovelEditor;
