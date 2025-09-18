import React, { useState } from 'react';
import { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Type,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreHorizontal,
} from 'lucide-react';

interface NotionBubbleMenuProps {
  editor: Editor;
}

export const NotionBubbleMenu: React.FC<NotionBubbleMenuProps> = ({ editor }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showTurnInto, setShowTurnInto] = useState(false);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setShowLinkInput(false);
      setLinkUrl('');
    }
  };

  const turnInto = (type: string) => {
    switch (type) {
      case 'heading1':
        editor.chain().focus().setNode('heading', { level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().setNode('heading', { level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().setNode('heading', { level: 3 }).run();
        break;
      case 'paragraph':
        editor.chain().focus().setNode('paragraph').run();
        break;
      default:
        break;
    }
    setShowTurnInto(false);
  };

  return (
    <div className="notion-bubble-toolbar feather-glass-modal">
      <div className="notion-bubble-content">
        {/* 转换为 */}
        <div className="notion-bubble-group">
          <button
            onClick={() => setShowTurnInto(!showTurnInto)}
            className="notion-bubble-button notion-bubble-turn-into"
            title="转换为"
          >
            <Type size={14} />
            <span className="notion-bubble-label">转换为</span>
          </button>

          {showTurnInto && (
            <div className="notion-bubble-dropdown feather-glass-dropdown">
              <button onClick={() => turnInto('paragraph')} className="notion-bubble-dropdown-item">
                <Type size={14} /> 文本
              </button>
              <button onClick={() => turnInto('heading1')} className="notion-bubble-dropdown-item">
                <Heading1 size={14} /> 标题 1
              </button>
              <button onClick={() => turnInto('heading2')} className="notion-bubble-dropdown-item">
                <Heading2 size={14} /> 标题 2
              </button>
              <button onClick={() => turnInto('heading3')} className="notion-bubble-dropdown-item">
                <Heading3 size={14} /> 标题 3
              </button>
            </div>
          )}
        </div>

        <div className="notion-bubble-divider" />

        {/* 文本格式 */}
        <div className="notion-bubble-group">
          <button
            onClick={() => editor.chain().focus().toggleMark('bold').run()}
            className={`notion-bubble-button ${editor.isActive('bold') ? 'active' : ''}`}
            title="加粗"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleMark('italic').run()}
            className={`notion-bubble-button ${editor.isActive('italic') ? 'active' : ''}`}
            title="斜体"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleMark('underline').run()}
            className={`notion-bubble-button ${editor.isActive('underline') ? 'active' : ''}`}
            title="下划线"
          >
            <UnderlineIcon size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleMark('strike').run()}
            className={`notion-bubble-button ${editor.isActive('strike') ? 'active' : ''}`}
            title="删除线"
          >
            <Strikethrough size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleMark('code').run()}
            className={`notion-bubble-button ${editor.isActive('code') ? 'active' : ''}`}
            title="代码"
          >
            <Code size={14} />
          </button>
        </div>

        <div className="notion-bubble-divider" />

        {/* 链接和高亮 */}
        <div className="notion-bubble-group">
          {showLinkInput ? (
            <div className="notion-bubble-link-input">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setLink();
                  } else if (e.key === 'Escape') {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }
                }}
                placeholder="粘贴链接..."
                className="notion-bubble-input"
                autoFocus
              />
              <button onClick={setLink} className="notion-bubble-link-confirm">
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const previousUrl = editor.getAttributes('link').href;
                setLinkUrl(previousUrl || '');
                setShowLinkInput(true);
              }}
              className={`notion-bubble-button ${editor.isActive('link') ? 'active' : ''}`}
              title="链接"
            >
              <Link size={14} />
            </button>
          )}
          <button
            onClick={() => editor.chain().focus().toggleMark('highlight').run()}
            className={`notion-bubble-button ${editor.isActive('highlight') ? 'active' : ''}`}
            title="高亮"
          >
            <Highlighter size={14} />
          </button>
        </div>

        <div className="notion-bubble-divider" />

        {/* 对齐 */}
        <div className="notion-bubble-group">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`notion-bubble-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
            title="左对齐"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`notion-bubble-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
            title="居中"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`notion-bubble-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
            title="右对齐"
          >
            <AlignRight size={14} />
          </button>
        </div>

        <div className="notion-bubble-divider" />

        {/* 更多选项 */}
        <button
          className="notion-bubble-button"
          title="更多"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
};