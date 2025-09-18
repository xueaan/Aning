import React from 'react';
import { Editor } from '@tiptap/core';
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
} from 'lucide-react';

interface NotionContextMenuProps {
  editor: Editor;
  position: { top: number; left: number };
  node?: any;
  onClose: () => void;
}

export const NotionContextMenu: React.FC<NotionContextMenuProps> = ({
  editor,
  position,
  onClose,
}) => {
  const handleCopy = () => {
    document.execCommand('copy');
    onClose();
  };

  const handleCut = () => {
    document.execCommand('cut');
    onClose();
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      editor.chain().focus().insertContent(text).run();
      onClose();
    });
  };

  const handleDelete = () => {
    editor.chain().focus().deleteSelection().run();
    onClose();
  };

  const handleTurnInto = (nodeType: string, attrs?: any) => {
    if (nodeType === 'paragraph') {
      editor.chain().focus().setNode('paragraph').run();
    } else if (nodeType === 'heading') {
      editor.chain().focus().setNode('heading', attrs).run();
    } else if (nodeType === 'bulletList') {
      editor.chain().focus().toggleBulletList().run();
    } else if (nodeType === 'orderedList') {
      editor.chain().focus().toggleOrderedList().run();
    } else if (nodeType === 'taskList') {
      editor.chain().focus().toggleTaskList().run();
    } else if (nodeType === 'blockquote') {
      editor.chain().focus().toggleNode('blockquote', 'paragraph').run();
    } else if (nodeType === 'codeBlock') {
      editor.chain().focus().toggleNode('codeBlock', 'paragraph').run();
    }
    onClose();
  };

  return (
    <div
      className="notion-context-menu feather-glass-modal"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10001,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 基本操作 */}
      <div className="notion-context-menu-section">
        <button className="notion-context-menu-item" onClick={handleCopy}>
          <Copy size={16} />
          <span>复制</span>
          <kbd>Ctrl+C</kbd>
        </button>
        <button className="notion-context-menu-item" onClick={handleCut}>
          <Scissors size={16} />
          <span>剪切</span>
          <kbd>Ctrl+X</kbd>
        </button>
        <button className="notion-context-menu-item" onClick={handlePaste}>
          <Clipboard size={16} />
          <span>粘贴</span>
          <kbd>Ctrl+V</kbd>
        </button>
        <button className="notion-context-menu-item danger" onClick={handleDelete}>
          <Trash2 size={16} />
          <span>删除</span>
          <kbd>Del</kbd>
        </button>
      </div>

      <div className="notion-context-menu-divider" />

      {/* 转换为 */}
      <div className="notion-context-menu-section">
        <div className="notion-context-menu-label">转换为</div>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('paragraph')}>
          <Type size={16} />
          <span>文本</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('heading', { level: 1 })}>
          <Heading1 size={16} />
          <span>标题 1</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('heading', { level: 2 })}>
          <Heading2 size={16} />
          <span>标题 2</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('bulletList')}>
          <List size={16} />
          <span>项目列表</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('orderedList')}>
          <ListOrdered size={16} />
          <span>编号列表</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('taskList')}>
          <CheckSquare size={16} />
          <span>待办列表</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('blockquote')}>
          <Quote size={16} />
          <span>引用</span>
        </button>
        <button className="notion-context-menu-item" onClick={() => handleTurnInto('codeBlock')}>
          <Code size={16} />
          <span>代码块</span>
        </button>
      </div>
    </div>
  );
};