import { createSuggestionItems, type SuggestionItem, Command } from "novel";
import {
  CheckCircle2,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  ImagePlus,
} from "lucide-react";

// 定义斜杠命令建议项
export const suggestionItems: SuggestionItem[] = createSuggestionItems([
  {
    title: "文本",
    description: "只是开始输入纯文本。",
    searchTerms: ["p", "paragraph", "text"],
    icon: <Pilcrow size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "标题 1",
    description: "大标题。",
    searchTerms: ["title", "big", "large", "h1"],
    icon: <Heading1 size={16} className="theme-text-primary font-bold" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "标题 2",
    description: "中等标题。",
    searchTerms: ["subtitle", "medium", "h2"],
    icon: <Heading2 size={16} className="theme-text-primary font-bold" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "标题 3",
    description: "小标题。",
    searchTerms: ["subtitle", "small", "h3"],
    icon: <Heading3 size={16} className="theme-text-primary font-bold" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "无序列表",
    description: "创建一个简单的无序列表。",
    searchTerms: ["unordered", "point"],
    icon: <List size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "有序列表",
    description: "创建一个带编号的列表。",
    searchTerms: ["ordered"],
    icon: <ListOrdered size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "任务列表",
    description: "带有复选框的任务列表。",
    searchTerms: ["todo", "task", "list", "check", "checkbox"],
    icon: <CheckCircle2 size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "引用",
    description: "捕获一个引用。",
    searchTerms: ["blockquote"],
    icon: <Quote size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "代码块",
    description: "捕获一个代码片段。",
    searchTerms: ["codeblock"],
    icon: <Code size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "分割线",
    description: "在视觉上分割块。",
    searchTerms: ["hr", "horizontal", "rule", "break"],
    icon: <Minus size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "图片",
    description: "插入图片到文档中。",
    searchTerms: ["image", "img", "photo", "picture"],
    icon: <ImagePlus size={16} className="theme-text-secondary" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();

      // 创建文件输入元素触发选择图片
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          // 动态导入图片处理函数
          const { processImageUpload } = await import("@/utils/imageUtils");
          const base64 = await processImageUpload(file, {
            quality: 0.8,
            maxWidth: 1200,
            maxHeight: 800,
            maxSize: 5,
          });

          // 插入图片到编辑器
          editor.chain().focus().setImage({ src: base64 }).run();
        } catch (error) {
          console.error("图片插入失败:", error);
          alert(
            error instanceof Error ? error.message : "图片插入失败，请重试",
          );
        }
      };
      input.click();
    },
  },
]);

// 导出配置好的斜杠命令扩展
export const slashCommand = Command.configure({
  suggestion: {
    items: ({ query }: { query: string }) => {
      return suggestionItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.searchTerms?.some((term) =>
            term.toLowerCase().includes(query.toLowerCase()),
          ),
      );
    },
  },
});
