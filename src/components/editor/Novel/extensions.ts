import {
  TiptapLink,
  TaskList,
  TaskItem,
  HorizontalRule as HorizontalRuleExtension,
  StarterKit,
  Placeholder,
  TiptapUnderline,
  UploadImagesPlugin
} from "novel";

// 导入图片调整大小扩展
import ResizableImage from "tiptap-extension-resize-image";

// 导入官方拖拽手柄扩展
import { DragHandle } from '@tiptap/extension-drag-handle';

// 直接从 TipTap 导入颜色相关扩展
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';

// 暂时回到 Tiptap 表格扩展，但使用自定义配置
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

// 导入 ProseMirror 的选择类型
import { NodeSelection } from '@tiptap/pm/state';

import { cx } from "class-variance-authority";
import { MarkdownPasteExtension } from "./markdown-paste-extension";
import { CalloutExtension } from "./callout-extension";
import { EnhancedBlockExtension } from "./enhanced-code-block-extension";

// 导入React和ReactDOM用于渲染菜单
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockActionMenu } from './BlockActionMenu';

// Placeholder configuration
const placeholder = Placeholder.configure({
  placeholder: ({ node }) => {
    if (node.type.name === "heading") {
      return `标题 ${node.attrs.level}`;
    }
    return "";
  },
  includeChildren: true
});

// TipTap Link configuration
const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      "theme-text-accent underline underline-offset-[3px] hover:opacity-80 transition-colors cursor-pointer"
    )
  }
});

// TaskList configuration
const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose")
  }
});

const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: '', // 清空默认类，让CSS控制
  },
  nested: true
});

// Horizontal Rule configuration
const horizontalRule = HorizontalRuleExtension.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t theme-border-primary")
  }
});

// StarterKit configuration
const starterKit = StarterKit.configure({
  heading: {
    HTMLAttributes: {
      class: '', // 清空默认类，让CSS控制
    }
  },
  paragraph: {
    HTMLAttributes: {
      class: '', // 清空默认类，让CSS控制
    }
  },
  bulletList: {
    HTMLAttributes: {
      class: '', // 清空默认类，让CSS控制
    }
  },
  orderedList: {
    HTMLAttributes: {
      class: '', // 清空默认类，让CSS控制
    }
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal")
    }
  },
  blockquote: {
    HTMLAttributes: {
      class: '', // 清空默认类，让CSS控制
    }
  },
  codeBlock: false,
  code: {
    HTMLAttributes: {
      class: cx("rounded-md theme-bg-secondary px-1.5 py-1 font-mono font-medium theme-text-error"),
      spellcheck: "false"
    }
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4
  },
  gapcursor: false  // 修复类型分配错误
});

// TextStyle configuration
const textStyle = TextStyle.configure({});

// Color configuration
const color = Color.configure({});

// Highlight configuration
const highlight = Highlight.configure({
  multicolor: true
});

// Tiptap 表格扩展配置 - 使用 anning-table 类名
const table = Table.configure({
  HTMLAttributes: {
    class: "anning-table prosemirror-table",
  },
  resizable: true,
  allowTableNodeSelection: true,
});

const tableRow = TableRow.configure({
  HTMLAttributes: {
    class: "anning-table-row",
  }
});

const tableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: "anning-table-header",
  }
});

const tableCell = TableCell.configure({
  HTMLAttributes: {
    class: "anning-table-cell",
  },
  // content: 'paragraph block*',  // 移除不兼容的content配置
});


// 配置 ResizableImage 扩展，支持拖拽调整大小
const resizableImage = ResizableImage.configure({
  HTMLAttributes: {
    class: 'rounded-lg max-w-full h-auto'
  },
  // 启用拖拽调整大小功能
  allowBase64: true
});

// 配置上传插件
const uploadImagesPlugin = UploadImagesPlugin({
  imageClass: 'rounded-lg max-w-full h-auto opacity-40'
});

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  resizableImage, // 使用支持调整大小的图片扩展
  taskList,
  taskItem,
  horizontalRule,
  TiptapUnderline,
  textStyle,
  color,
  highlight,
  // 表格扩展 - 使用 Tiptap 扩展但配置 anning-table 类名
  table,
  tableRow,
  tableHeader,
  tableCell,
  MarkdownPasteExtension,
  CalloutExtension,
  EnhancedBlockExtension.configure({
    defaultLanguage: '',
    HTMLAttributes: {}
  }),
  uploadImagesPlugin, // 添加图片上传插件
  DragHandle.configure({
    render: () => {
      const handle = document.createElement('div');
      handle.classList.add('drag-handle-official');

      // 创建 + 号按钮（使用SVG图标而不是React组件）
      const addButton = document.createElement('div');
      addButton.classList.add('drag-handle-add');
      addButton.title = '在下方添加新段落';

      // 使用SVG而不是React组件，避免渲染警告
      addButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';

      handle.appendChild(addButton);

      // 创建六个小点的容器
      const dotsContainer = document.createElement('div');
      dotsContainer.classList.add('drag-handle-dots');

      // 创建六个小点的HTML结构
      for (let i = 0; i < 6; i++) {
        const dot = document.createElement('div');
        dot.classList.add('drag-handle-dot');
        dotsContainer.appendChild(dot);
      }

      handle.appendChild(dotsContainer);

      // 菜单状态管理
      let menuContainer: HTMLElement | null = null;
      let menuRoot: any = null;
      let clickTimer: NodeJS.Timeout | null = null;
      let currentEditor: any = null;
      let currentNodePos: number = -1;

      // 关闭菜单函数
      const closeMenu = () => {
        if (menuContainer && menuRoot) {
          menuRoot.unmount();
          document.body.removeChild(menuContainer);
          menuContainer = null;
          menuRoot = null;
        }
      };

      // 显示菜单函数
      const showMenu = (editor: any, nodePos: number, rect: DOMRect) => {
        closeMenu(); // 先关闭已有菜单

        // 在显示菜单前自动选中对应的块
        try {
          const { state } = editor;
          const { doc } = state;

          // 验证 nodePos 是否有效
          if (nodePos < 0 || nodePos > doc.content.size) {
            console.warn('Invalid nodePos:', nodePos);
            editor.chain().focus().run();
            menuContainer = document.createElement('div');
            menuContainer.style.position = 'fixed';
            menuContainer.style.left = `${rect.right + 8}px`;
            menuContainer.style.top = `${rect.top}px`;
            menuContainer.style.zIndex = '9999';
            document.body.appendChild(menuContainer);

            menuRoot = createRoot(menuContainer);
            menuRoot.render(
              React.createElement(BlockActionMenu, {
                editor,
                nodePos,
                onClose: closeMenu,
              })
            );
            return;
          }

          // 尝试找到nodePos位置的节点
          let targetNode: any = null;
          let targetPos = -1;
          let found = false;

          // 遍历文档找到包含nodePos的最顶层块节点
          doc.descendants((node: any, pos: number) => {
            if (!found && pos <= nodePos && pos + node.nodeSize > nodePos) {
              if (node.type.isBlock && node.type.name !== 'doc') {
                targetNode = node;
                targetPos = pos;
                // 对于表格，找到表格本身就停止
                if (node.type.name === 'table') {
                  found = true;
                  return false;
                }
              }
            }
          });

          if (targetNode && targetPos >= 0) {
            // 特殊处理表格
            if (targetNode.type.name === 'table') {
              // 使用 NodeSelection 来选中整个表格
              try {
                const selection = NodeSelection.create(state.doc, targetPos);
                editor.view.dispatch(state.tr.setSelection(selection));
              } catch (e) {
                // 如果 NodeSelection 失败，尝试将光标放在表格开始位置
                editor.chain().focus().setTextSelection(targetPos).run();
              }
            }
            // 处理其他块节点
            else {
              // 使用 setNodeSelection 命令选中块
              try {
                editor.commands.setNodeSelection(targetPos);
              } catch (e) {
                // 如果失败，至少将光标放在节点位置
                editor.chain().focus().setTextSelection(targetPos).run();
              }
            }
          } else {
            // 如果没找到合适的节点，使用当前选区
            editor.chain().focus().run();
          }

        } catch (error) {
          console.error('❌ Error in showMenu auto-selection:', error);
          // 发生错误时，至少确保编辑器获得焦点
          editor.chain().focus().run();
        }

        menuContainer = document.createElement('div');
        menuContainer.style.position = 'fixed';
        menuContainer.style.left = `${rect.right + 8}px`;
        menuContainer.style.top = `${rect.top}px`;
        menuContainer.style.zIndex = '9999';
        document.body.appendChild(menuContainer);

        menuRoot = createRoot(menuContainer);
        menuRoot.render(
          React.createElement(BlockActionMenu, {
            editor,
            nodePos,
            onClose: closeMenu,
          })
        );
      };

      // 存储编辑器信息 - 初始化时节点位置未知
      (handle as any).setEditorInfo = (editor: any, nodePos: number) => {
        currentEditor = editor;
        currentNodePos = nodePos;
      };
      
      // + 号点击事件：添加新段落
      addButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (currentEditor && currentNodePos >= 0) {
          const node = currentEditor.state.doc.nodeAt(currentNodePos);
          if (node) {
            const insertPos = currentNodePos + node.nodeSize;
            
            // 在当前节点后插入新的段落
            currentEditor.chain()
              .focus()
              .insertContentAt(insertPos, { type: 'paragraph' })
              .setTextSelection(insertPos + 1)
              .run();
          }
        }
      });
      
      // 六个小点的点击事件监听（仅限dotsContainer）
      dotsContainer.addEventListener('mousedown', () => {
        // 设置点击计时器，区分点击和拖拽
        clickTimer = setTimeout(() => {
          clickTimer = null;
        }, 200);
      });
      
      dotsContainer.addEventListener('mouseup', (e) => {
        if (clickTimer) {
          // 短时间内mouseup，认为是点击
          clearTimeout(clickTimer);
          e.preventDefault();
          e.stopPropagation();

          if (currentEditor) {
            // 如果nodePos无效，使用当前光标位置
            let effectiveNodePos = currentNodePos >= 0 ? currentNodePos : 0;
            const rect = dotsContainer.getBoundingClientRect();
            showMenu(currentEditor, effectiveNodePos, rect);
          }
        }
      });
      
      // 点击其他区域关闭菜单
      const handleDocumentClick = (e: Event) => {
        if (menuContainer && !menuContainer.contains(e.target as Node) && !handle.contains(e.target as Node)) {
          closeMenu();
        }
      };
      
      document.addEventListener('click', handleDocumentClick);
      
      // 清理函数
      (handle as any).cleanup = () => {
        document.removeEventListener('click', handleDocumentClick);
        closeMenu();
      };
      
      return handle;
    },
    onNodeChange: ({ node, editor }) => {
      // 更新所有拖拽手柄的编辑器信息
      const handles = document.querySelectorAll('.drag-handle-official');

      // 使用当前选区位置作为默认位置
      let actualNodePos = editor.state.selection.from;

      // 如果pos未提供，尝试计算当前节点的实际位置
      if (typeof actualNodePos !== 'number' && node) {
        try {
          // 尝试通过遍历文档找到该节点的位置
          editor.state.doc.descendants((foundNode, foundNodePos) => {
            if (foundNode === node) {
              actualNodePos = foundNodePos;
              return false; // 停止遍历
            }
            return true;
          });
        } catch (error) {
          actualNodePos = editor.state.selection.from;
        }
      }

      // 如果仍然没有有效位置，使用当前选区位置
      if (typeof actualNodePos !== 'number') {
        actualNodePos = editor.state.selection.from;
      }

      handles.forEach(handle => {
        if ((handle as any).setEditorInfo) {
          (handle as any).setEditorInfo(editor, actualNodePos);
        }
      });

      // 只在有内容的节点上显示拖拽手柄
      if (!node || !node.type) {
        return;
      }

      // 检查是否为空段落
      const isEmpty = node.type.name === 'paragraph' && (!node.textContent || node.textContent.trim() === '');

      handles.forEach(handle => {
        const handleElement = handle as HTMLElement;

        if (isEmpty) {
          // 空段落：隐藏手柄并添加标记
          handleElement.style.display = 'none';
          handleElement.setAttribute('data-empty', 'true');
        } else {
          // 非空段落：显示手柄并移除标记
          handleElement.style.display = 'grid';
          handleElement.removeAttribute('data-empty');
        }
      });
    },
  }), // 使用官方DragHandle扩展
];