import React, { useState } from 'react';
import { Copy, Trash2, RefreshCw, ChevronRight, Text, Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered, Quote, Code } from 'lucide-react';
import { Editor } from '@tiptap/core';

// 定义格式转换选项 - 复用NodeSelector的逻辑
export type FormatItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (editor: any) => void;
  isActive: (editor: any) => boolean;
};

const formatItems: FormatItem[] = [
  {
    name: "正文",
    icon: Text,
    command: (editor) => editor?.chain().focus().setParagraph().run(),
    isActive: (editor) =>
      (editor?.isActive("paragraph") && !editor?.isActive("bulletList") && !editor?.isActive("orderedList")) ?? false
  },
  {
    name: "标题 1",
    icon: Heading1,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 1 }) ?? false
  },
  {
    name: "标题 2",
    icon: Heading2,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 2 }) ?? false
  },
  {
    name: "标题 3",
    icon: Heading3,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 3 }) ?? false
  },
  {
    name: "待办列表",
    icon: CheckSquare,
    command: (editor) => editor?.chain().focus().toggleTaskList().run(),
    isActive: (editor) => editor?.isActive("taskItem") ?? false
  },
  {
    name: "无序列表",
    icon: List,
    command: (editor) => editor?.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor?.isActive("bulletList") ?? false
  },
  {
    name: "有序列表",
    icon: ListOrdered,
    command: (editor) => editor?.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor?.isActive("orderedList") ?? false
  },
  {
    name: "引用",
    icon: Quote,
    command: (editor) => editor?.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor?.isActive("blockquote") ?? false
  },
  {
    name: "代码",
    icon: Code,
    command: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor?.isActive("codeBlock") ?? false
  },
];

interface BlockActionMenuProps {
  editor: Editor;
  nodePos: number;
  onClose: () => void;
}

export const BlockActionMenu: React.FC<BlockActionMenuProps> = ({
  editor,
  nodePos: _nodePos,
  onClose,
}) => {
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleFormatChange = (item: FormatItem) => {
    // 由于showMenu已经自动选中了对应的块，直接执行格式转换命令即可
    item.command(editor);
    onClose();
  };

  const handleCopyToClipboard = () => {
    // 由于showMenu已经自动选中了对应的块，直接复制当前选区的文本
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    if (selectedText.trim()) {
      navigator.clipboard.writeText(selectedText.trim());
    }
    onClose();
  };

  const handleDeleteParagraph = () => {
    // 由于showMenu已经自动选中了对应的块，直接删除当前选区
    if (!editor.state.selection.empty) {
      editor.chain().focus().deleteSelection().run();
    }
    onClose();
  };

  return (
    <div className="block-action-menu">
      {/* 转换为格式功能 */}
      <div className="block-action-item-group">
        <button
          className="block-action-item format-trigger"
          onClick={() => setShowFormatMenu(!showFormatMenu)}
          title="转换为"
        >
          <RefreshCw size={16} />
          <span>转换</span>
          <ChevronRight size={14} className={`chevron ${showFormatMenu ? 'expanded' : ''}`} />
        </button>

        {/* 格式选择子菜单 */}
        {showFormatMenu && (
          <div className="format-submenu">
            {formatItems.map((item) => (
              <button
                key={item.name}
                className={`format-item ${item.isActive(editor) ? 'active' : ''}`}
                onClick={() => handleFormatChange(item)}
                title={item.name}
              >
                <div className="format-icon">
                  <item.icon className="h-3 w-3" />
                </div>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="menu-separator"></div>

      {/* 其他操作 */}
      <button
        className="block-action-item"
        onClick={handleCopyToClipboard}
        title="复制到剪贴板"
      >
        <Copy size={16} />
        <span>复制</span>
      </button>

      <button
        className="block-action-item delete-item"
        onClick={handleDeleteParagraph}
        title="删除段落"
      >
        <Trash2 size={16} />
        <span>删除</span>
      </button>
    </div>
  );
};