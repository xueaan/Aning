import React from 'react';
import { Editor } from '@tiptap/core';
import {
  Type,
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
  Minus,
} from 'lucide-react';

interface NotionFloatingMenuProps {
  editor: Editor;
}

export const NotionFloatingMenu: React.FC<NotionFloatingMenuProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="notion-floating-toolbar feather-glass-panel">
      <div className="notion-floating-toolbar-group">
        <button
          onClick={() => editor.chain().focus().setNode('paragraph').run()}
          className="notion-floating-button"
          title="文本"
        >
          <Type size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setNode('heading', { level: 1 }).run()}
          className="notion-floating-button"
          title="标题 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setNode('heading', { level: 2 }).run()}
          className="notion-floating-button"
          title="标题 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setNode('heading', { level: 3 }).run()}
          className="notion-floating-button"
          title="标题 3"
        >
          <Heading3 size={18} />
        </button>
      </div>

      <div className="notion-floating-divider" />

      <div className="notion-floating-toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="notion-floating-button"
          title="项目列表"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="notion-floating-button"
          title="编号列表"
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className="notion-floating-button"
          title="待办列表"
        >
          <CheckSquare size={18} />
        </button>
      </div>

      <div className="notion-floating-divider" />

      <div className="notion-floating-toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleNode('blockquote', 'paragraph').run()}
          className="notion-floating-button"
          title="引用"
        >
          <Quote size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="notion-floating-button"
          title="代码块"
        >
          <Code size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().insertContent('<hr />').run()}
          className="notion-floating-button"
          title="分割线"
        >
          <Minus size={18} />
        </button>
      </div>

      <div className="notion-floating-divider" />

      <div className="notion-floating-toolbar-group">
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
          <Image size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="notion-floating-button"
          title="表格"
        >
          <Table size={18} />
        </button>
      </div>
    </div>
  );
};