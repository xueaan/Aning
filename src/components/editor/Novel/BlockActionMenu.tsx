import React from 'react';
import { RemoveFormatting, Palette, Copy, Trash2 } from 'lucide-react';
import { Editor } from '@tiptap/core';

interface BlockActionMenuProps {
  editor: Editor;
  nodePos: number;
  onClose: () => void;
}

export const BlockActionMenu: React.FC<BlockActionMenuProps> = ({
  editor,
  nodePos,
  onClose,
}) => {
  const handleClearFormat = () => {
    try {
      const node = editor.state.doc.nodeAt(nodePos);
      if (!node) return;
      
      const from = nodePos;
      const to = nodePos + node.nodeSize;
      
      // 清空格式：移除粗体、斜体、下划线等所有标记
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetMark('bold')
        .unsetMark('italic')
        .unsetMark('underline')
        .unsetMark('strike')
        .unsetMark('code')
        .run();
    } catch (error) {
      console.warn('Clear format failed:', error);
    }
    onClose();
  };

  const handleClearStyle = () => {
    try {
      const node = editor.state.doc.nodeAt(nodePos);
      if (!node) return;
      
      const from = nodePos;
      const to = nodePos + node.nodeSize;
      
      // 清空样式：移除颜色和高亮
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetColor()
        .unsetHighlight()
        .run();
    } catch (error) {
      console.warn('Clear style failed:', error);
    }
    onClose();
  };

  const handleCopyToClipboard = () => {
    try {
      const node = editor.state.doc.nodeAt(nodePos);
      if (node && node.textContent) {
        navigator.clipboard.writeText(node.textContent.trim());
        // 可以添加一个toast提示复制成功
      }
    } catch (error) {
      console.warn('Copy to clipboard failed:', error);
    }
    onClose();
  };

  const handleDeleteParagraph = () => {
    try {
      const node = editor.state.doc.nodeAt(nodePos);
      if (!node) return;
      
      const from = nodePos;
      const to = nodePos + node.nodeSize;
      
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .run();
    } catch (error) {
      console.warn('Delete paragraph failed:', error);
    }
    onClose();
  };

  return (
    <div className="block-action-menu">
      <button 
        className="block-action-item"
        onClick={handleClearFormat}
        title="清空格式"
      >
        <RemoveFormatting size={16} />
        <span>清空格式</span>
      </button>
      
      <button 
        className="block-action-item"
        onClick={handleClearStyle}
        title="清空样式"
      >
        <Palette size={16} />
        <span>清空样式</span>
      </button>
      
      <button 
        className="block-action-item"
        onClick={handleCopyToClipboard}
        title="复制到剪贴板"
      >
        <Copy size={16} />
        <span>复制到剪贴板</span>
      </button>
      
      <button 
        className="block-action-item delete-item"
        onClick={handleDeleteParagraph}
        title="删除段落"
      >
        <Trash2 size={16} />
        <span>删除段落</span>
      </button>
    </div>
  );
};