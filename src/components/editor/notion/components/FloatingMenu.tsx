import React from 'react';
import { Editor } from '@tiptap/core';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Table,
} from 'lucide-react';

interface FloatingMenuProps {
  editor: Editor;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // 检查是否应该显示菜单
  const { selection } = editor.state;
  const { $from } = selection;
  const node = $from.parent;

  // 只在空段落时显示
  const shouldShow = node.type.name === 'paragraph' && node.content.size === 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="notion-floating-menu feather-glass-panel">
      <button
        onClick={() => editor.chain().focus().setNode('heading', { level: 1 }).run()}
        className="notion-floating-button"
        title="标题 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setNode('heading', { level: 2 }).run()}
        className="notion-floating-button"
        title="标题 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setNode('heading', { level: 3 }).run()}
        className="notion-floating-button"
        title="标题 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="notion-floating-divider" />

      <button
        onClick={() => editor.chain().focus().toggleList('bulletList', 'listItem').run()}
        className="notion-floating-button"
        title="项目列表"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleList('orderedList', 'listItem').run()}
        className="notion-floating-button"
        title="编号列表"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleList('taskList', 'taskItem').run()}
        className="notion-floating-button"
        title="待办列表"
      >
        <CheckSquare size={16} />
      </button>

      <div className="notion-floating-divider" />

      <button
        onClick={() => editor.chain().focus().toggleNode('blockquote', 'paragraph').run()}
        className="notion-floating-button"
        title="引用"
      >
        <Quote size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleNode('codeBlock', 'paragraph').run()}
        className="notion-floating-button"
        title="代码块"
      >
        <Code size={16} />
      </button>

      <div className="notion-floating-divider" />

      <button
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const src = event.target?.result as string;
                editor.chain().focus().setImage({ src }).run();
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}
        className="notion-floating-button"
        title="图片"
      >
        <Image size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="notion-floating-button"
        title="表格"
      >
        <Table size={16} />
      </button>
    </div>
  );
};