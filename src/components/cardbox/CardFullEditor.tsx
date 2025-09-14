import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { NovelEditor, type NovelEditorRef } from "@/components/editor/Novel";
import { RichEditorToolbar } from "@/components/editor/RichEditorToolbar";
import { type Card } from "@/stores";
import { debounce } from "@/utils/debounce";
import {
  extractHeadings,
  scrollToHeading,
  getActiveHeadingId,
  flattenOutlineItems,
  type OutlineItem,
} from "@/pages/Knowledge/components/HeadingExtractor";
import { FloatingOutline } from "@/pages/Knowledge/components/FloatingOutline";

interface CardFullEditorProps {
  isOpen: boolean;
  card?: Card | null;
  boxId?: string | null;
  onClose: () => void;
  onSave: (
    title: string,
    content: string,
    shouldClose?: boolean,
  ) => Promise<void>;
  className?: string;
}

export const CardFullEditor: React.FC<CardFullEditorProps> = ({
  isOpen,
  card,
  boxId,
  onClose,
  onSave,
  className = "",
}) => {
  const editorRef = useRef<NovelEditorRef>(null);
  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // 大纲相关状态
  const [headings, setHeadings] = useState<OutlineItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [isOutlineVisible, setIsOutlineVisible] = useState(false);

  // 防抖自动保存函数
  const debouncedAutoSave = useCallback(
    debounce(async (title: string, content: string) => {
      if (title.trim() && (boxId || card)) {
        try {
          await onSave(title.trim(), content, false);
          setHasChanges(false);
        } catch (error) {
          console.error("自动保存失败:", error);
        }
      }
    }, 2000),
    [boxId, card, onSave],
  );

  // 初始化编辑器内容
  useEffect(() => {
    if (isOpen) {
      const initialContent = card?.content || "";
      const initialTitle = card?.title || "";

      setTitle(initialTitle);
      setEditorContent(initialContent);
      setHasChanges(false);

      // 延迟设置编辑器内容确保编辑器已完全初始化
      const timer = setTimeout(() => {
        if (editorRef.current) {
          try {
            editorRef.current.setValue(initialContent);
            updateOutline(initialContent);
          } catch (error) {
            console.error('Failed to set editor content:', error);
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    } else {
      // 编辑器关闭时清理状态
      setTitle("");
      setEditorContent("");
      setHasChanges(false);
      setHeadings([]);
      setActiveHeadingId(null);
      setIsOutlineVisible(false);
    }
  }, [isOpen, card]);

  // 监听内容变化并触发自动保存
  useEffect(() => {
    if (hasChanges && title.trim()) {
      debouncedAutoSave(title, editorContent);
    }
  }, [title, editorContent, hasChanges, debouncedAutoSave]);

  // 处理内容变化
  const handleContentChange = (content: string) => {
    setEditorContent(content);
    setHasChanges(true);
    debouncedUpdateFormats();
    updateOutline(content);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  // 更新大纲
  const updateOutline = (content: string) => {
    const newHeadings = extractHeadings(content);
    setHeadings(newHeadings);

    const headingIds = flattenOutlineItems(newHeadings).map((item) => item.id);
    const activeId = getActiveHeadingId(headingIds);
    setActiveHeadingId(activeId);
  };

  // 处理大纲点击
  const handleOutlineClick = (id: string) => {
    scrollToHeading(id);
    setActiveHeadingId(id);
  };

  // 更新工具栏活跃状态
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;

    const formats: string[] = [];
    const editor = editorRef.current;

    if (editor.isActive("bold")) formats.push("bold");
    if (editor.isActive("italic")) formats.push("italic");
    if (editor.isActive("strike")) formats.push("strike");
    if (editor.isActive("code")) formats.push("code");
    if (editor.isActive("heading", { level: 1 })) formats.push("heading1");
    if (editor.isActive("heading", { level: 2 })) formats.push("heading2");
    if (editor.isActive("heading", { level: 3 })) formats.push("heading3");
    if (editor.isActive("paragraph")) formats.push("paragraph");
    if (editor.isActive("textAlign", { textAlign: "left" }))
      formats.push("left");
    if (editor.isActive("textAlign", { textAlign: "center" }))
      formats.push("center");
    if (editor.isActive("textAlign", { textAlign: "right" }))
      formats.push("right");
    if (editor.isActive("bullet")) formats.push("bullet");
    if (editor.isActive("ordered")) formats.push("ordered");
    if (editor.isActive("blockquote")) formats.push("blockquote");
    if (editor.isActive("codeBlock")) formats.push("codeBlock");

    setActiveFormats(formats);
  }, []);

  const debouncedUpdateFormats = useCallback(
    debounce(() => {
      updateActiveFormats();
    }, 100),
    [updateActiveFormats],
  );

  // 处理工具栏格式化
  const handleFormat = (format: string) => {
    if (!editorRef.current) return;

    switch (format) {
      case "bold":
        editorRef.current.toggleBold();
        break;
      case "italic":
        editorRef.current.toggleItalic();
        break;
      case "strike":
        editorRef.current.toggleStrike();
        break;
      case "code":
        editorRef.current.toggleCode();
        break;
      case "heading1":
        editorRef.current.toggleHeading(1);
        break;
      case "heading2":
        editorRef.current.toggleHeading(2);
        break;
      case "heading3":
        editorRef.current.toggleHeading(3);
        break;
      case "paragraph":
        editorRef.current.setParagraph();
        break;
      case "left":
        editorRef.current.setTextAlign("left");
        break;
      case "center":
        editorRef.current.setTextAlign("center");
        break;
      case "right":
        editorRef.current.setTextAlign("right");
        break;
      case "bullet":
        editorRef.current.toggleBullet();
        break;
      case "ordered":
        editorRef.current.toggleOrdered();
        break;
      case "blockquote":
        editorRef.current.toggleBlockquote();
        break;
      case "codeBlock":
        editorRef.current.toggleCodeBlock();
        break;
    }
  };

  // 关闭编辑器
  const handleClose = async () => {
    if (hasChanges && title.trim()) {
      try {
        await onSave(title.trim(), editorContent, true);
      } catch (error) {
        console.error("保存失败:", error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={cn("h-full flex flex-col relative", className)}>
      {/* 头部工具栏 */}
      <div className="flex items-center justify-start gap-4 p-2 theme-border">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:theme-bg-tertiary transition-colors"
          title="返回"
        >
          <ArrowLeft size={20} className="theme-text-secondary" />
        </button>

        <div className="flex-1 flex justify-center">
          <RichEditorToolbar
            onFormat={handleFormat}
            activeFormats={activeFormats}
            className="bg-transparent"
          />
        </div>

        <button
          onClick={() => setIsOutlineVisible(!isOutlineVisible)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isOutlineVisible
              ? "theme-bg-tertiary"
              : "hover:theme-bg-tertiary",
          )}
          title="显示大纲"
        >
          <Eye size={18} className="theme-text-secondary" />
        </button>
      </div>
      <div className="px-6 py-2  theme-border">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="输入笔记标题..."
          className="w-full text-3xl font-bold theme-text-primary bg-transparent border-none outline-none placeholder:theme-text-tertiary"
          autoFocus={!card}
        />
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-6 py-4">
            <NovelEditor
              ref={editorRef}
              value={editorContent}
              onChange={handleContentChange}
              placeholder="开始编写你的想法..."
              className="h-full"
            />
          </div>
        </div>
        {isOutlineVisible && headings.length > 0 && (
          <FloatingOutline
            headings={headings}
            activeHeadingId={activeHeadingId}
            onHeadingClick={handleOutlineClick}
            onClose={() => setIsOutlineVisible(false)}
          />
        )}
      </div>
    </div>
  );
};
