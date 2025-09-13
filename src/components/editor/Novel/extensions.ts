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

import { cx } from "class-variance-authority";
import { MarkdownPasteExtension } from "./markdown-paste-extension";
import { CalloutExtension } from "./callout-extension";
import { EnhancedBlockExtension } from "./enhanced-code-block-extension";

// 导入React和ReactDOM用于渲染菜单
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockActionMenu } from './BlockActionMenu';
import { Plus } from 'lucide-react';

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
  gapcursor: false
});

// TextStyle configuration
const textStyle = TextStyle.configure({});

// Color configuration
const color = Color.configure({});

// Highlight configuration
const highlight = Highlight.configure({
  multicolor: true
});

// 图片上传处理函数（保留备用）
// const imageUpload = createImageUpload({
//   validateFn: (file: File) => {
//     const error = validateImageFile(file, 5); // 5MB 限制
//     if (error) {
//       throw new Error(error);
//     }
//   },
//   onUpload: async (file: File) => {
//     try {
//       // 处理图片：压缩并转换为 base64
//       const base64 = await processImageUpload(file, {
//         quality: 0.8,
//         maxWidth: 1920,
//         maxHeight: 1080,
//         maxSize: 5,
//       });
//       
//       return base64; // 返回 base64 数据 URL
//     } catch (error) {
//       console.error('图片上传处理失败:', error);
//       throw error;
//     }
//   },
// });

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
      
      // 创建 + 号按钮（使用Plus图标）
      const addButton = document.createElement('div');
      addButton.classList.add('drag-handle-add');
      addButton.title = '在下方添加新段落';
      
      // 使用React渲染Plus图标
      const addButtonRoot = createRoot(addButton);
      addButtonRoot.render(React.createElement(Plus, { size: 16 }));
      
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
      
      // 存储编辑器信息
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
          
          if (currentEditor && currentNodePos >= 0) {
            const rect = dotsContainer.getBoundingClientRect();
            showMenu(currentEditor, currentNodePos, rect);
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
      // 获取当前节点位置
      const nodePos = 0;
      
      // 更新所有拖拽手柄的编辑器信息
      const handles = document.querySelectorAll('.drag-handle-official');
      handles.forEach(handle => {
        if ((handle as any).setEditorInfo) {
          (handle as any).setEditorInfo(editor, nodePos);
        }
      });
      
      // 只在有内容的节点上显示拖拽手柄
      if (!node) return;
      
      // 空段落或仅包含占位符的节点不显示拖拽手柄
      if (node.type.name === 'paragraph' && node.textContent.trim() === '') {
        handles.forEach(handle => {
          (handle as HTMLElement).style.display = 'none';
        });
        return;
      }
      
      // 其他情况恢复显示
      handles.forEach(handle => {
        (handle as HTMLElement).style.display = 'grid';
      });
    },
  }), // 使用官方DragHandle扩展
];