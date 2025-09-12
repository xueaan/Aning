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

// 导入拖拽手柄扩展
import GlobalDragHandle from "tiptap-extension-global-drag-handle";

// 直接从 TipTap 导入颜色相关扩展
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';

import { cx } from "class-variance-authority";
import { MarkdownPasteExtension } from "./markdown-paste-extension";
import { CalloutExtension } from "./callout-extension";
import { EnhancedBlockExtension } from "./enhanced-code-block-extension";

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
  GlobalDragHandle.configure({
    dragHandleWidth: 20, // 拖拽手柄宽度
    scrollTreshold: 100, // 滚动敏感度  
  }), // 添加拖拽手柄扩展 - 应该显示在左侧
];