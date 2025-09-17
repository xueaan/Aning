// @ts-nocheck
/* @ts-nocheck */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ParagraphNode, $getSelection, $isRangeSelection, KEY_DOWN_COMMAND, $getRoot } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import TableSizeGrid from '../components/TableSizeGrid';

const getCaretRect = (): DOMRect | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  return rect;
};

export const SlashMenu: React.FC<{ onInsertTable: (rows: number, cols: number) => void }> = ({ onInsertTable }) => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [query, setQuery] = useState('');

  const safeInsertTop = (createNode: () => any) => {
    editor.update(() => {
      const sel = $getSelection();
      const node = createNode();
      if ($isRangeSelection(sel)) {
        try {
          const top = sel.anchor.getNode().getTopLevelElementOrThrow();
          top.insertAfter(node);
          node.select?.();
          return;
        } catch {}
      }
      $getRoot().append(node);
      node.select?.();
    });
  };

  const items = useMemo(
    () => [
      { id: 'h1', label: '标题 1', action: () => safeInsertTop(() => $createHeadingNode('h1')) },
      { id: 'h2', label: '标题 2', action: () => safeInsertTop(() => $createHeadingNode('h2')) },
      { id: 'h3', label: '标题 3', action: () => safeInsertTop(() => $createHeadingNode('h3')) },
      { id: 'ul', label: '无序列表', action: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
      { id: 'ol', label: '有序列表', action: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) },
      { id: 'blockquote', label: '引用', action: () => safeInsertTop(() => $createQuoteNode()) },
      { id: 'code', label: '代码块', action: () => safeInsertTop(() => $createCodeNode()) },
      { id: 'table', label: '表格 2×2', action: () => onInsertTable(2, 2) },
    ],
    [editor]
  );

  const filtered = items.filter((it) => it.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (!open && event.key === '/') {
          const rect = getCaretRect();
          if (rect) {
            setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
            setOpen(true);
            setQuery('');
            return true;
          }
        }
        if (open) {
          if (event.key === 'Escape') {
            setOpen(false);
            return true;
          }
        }
        return false;
      },
      1
    );
  }, [editor, open]);

  const onPick = useCallback(
    (id: string) => {
      if (id === 'table') {
        // show grid
        const grid = document.createElement('div');
        grid.style.position = 'fixed';
        grid.style.left = `${pos.left}px`;
        grid.style.top = `${pos.top}px`;
        grid.style.zIndex = '9999';
        document.body.appendChild(grid);
        const cleanup = () => {
          grid.remove();
          setOpen(false);
        };
        const onSelect = (r: number, c: number) => {
          onInsertTable(r, c);
          cleanup();
        };
        const ui = (
          <div className="feather-glass-panel rounded-md p-2">
            <TableSizeGrid onSelect={onSelect} />
          </div>
        );
        createPortal(ui, grid);
        return;
      }
      const found = items.find((it) => it.id === id);
      found?.action();
      setOpen(false);
    },
    [items, onInsertTable, pos.left, pos.top]
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed z-50 rounded-md feather-glass-panel p-2 w-64" style={{ top: pos.top, left: pos.left }}>
      <input
        className="w-full mb-2 text-xs px-2 py-1 rounded theme-bg-secondary outline-none"
        placeholder="搜索命令…"
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (filtered.length > 0) onPick(filtered[0].id);
          }
        }}
      />
      <div className="flex flex-col gap-1 max-h-48 overflow-auto">
        {filtered.map((it) => (
          <button key={it.id} className="px-2 py-1 text-left rounded hover:theme-bg-primary/40 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(it.id)}>
            {it.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default SlashMenu;


