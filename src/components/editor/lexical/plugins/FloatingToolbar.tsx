// @ts-nocheck
/* @ts-nocheck */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';

const getSelectionRect = (): DOMRect | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect && rect.width !== 0 && rect.height !== 0) return rect;
  const dummy = document.createElement('span');
  range.cloneRange().insertNode(dummy);
  const r = dummy.getBoundingClientRect();
  dummy.parentNode?.removeChild(dummy);
  return r;
};

export const FloatingToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        const isRange = $isRangeSelection(selection) && !selection.isCollapsed();
        if (!isRange) {
          setOpen(false);
          return;
        }
        const rect = getSelectionRect();
        if (!rect) {
          setOpen(false);
          return;
        }
        setOpen(true);
        const offset = 8;
        setPos({ top: rect.top + window.scrollY - 40 - offset, left: rect.left + window.scrollX + rect.width / 2 });
      });
    });
  }, [editor]);

  const toggle = (cmd: 'bold' | 'italic' | 'underline' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, cmd);
  };

  const toggleLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url: prompt('输入链接地址') || '' });
  };

  const ui = (
    <div
      ref={containerRef}
      className="fixed z-50 rounded-md shadow px-2 py-1 theme-bg-secondary border theme-border-primary text-xs"
      style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center gap-2">
        <button className="hover:opacity-80" onMouseDown={(e) => e.preventDefault()} onClick={() => toggle('bold')}>B</button>
        <button className="hover:opacity-80" onMouseDown={(e) => e.preventDefault()} onClick={() => toggle('italic')}>I</button>
        <button className="hover:opacity-80" onMouseDown={(e) => e.preventDefault()} onClick={() => toggle('underline')}>U</button>
        <button className="hover:opacity-80" onMouseDown={(e) => e.preventDefault()} onClick={() => toggle('code')}>{'</>'}</button>
        <button className="hover:opacity-80" onMouseDown={(e) => e.preventDefault()} onClick={toggleLink}>Link</button>
      </div>
    </div>
  );

  if (!open) return null;
  return createPortal(ui, document.body);
};

export default FloatingToolbar;


