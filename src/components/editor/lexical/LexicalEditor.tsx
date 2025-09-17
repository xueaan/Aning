/* @ts-nocheck */
/* @ts-nocheck */
import React, { useCallback, useMemo, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { CodeNode } from '@lexical/code';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $insertNodes } from 'lexical';
import FloatingToolbar from './plugins/FloatingToolbar';
import SlashMenu from './plugins/SlashMenu';

type TableSize = { rows: number; cols: number };

const Placeholder: React.FC = () => (
  <div className="theme-text-tertiary select-none pointer-events-none">开始输入…（Lexical）</div>
);

const Toolbar: React.FC<{ onInsertTable: (size: TableSize) => void }> = ({ onInsertTable }) => {
  const sizes = useMemo(() => [
    { rows: 2, cols: 2 },
    { rows: 3, cols: 2 },
    { rows: 3, cols: 3 },
    { rows: 4, cols: 2 },
  ], []);
  return (
    <div className="flex items-center gap-2 p-2 border-b theme-border-primary">
      <span className="theme-text-secondary text-sm">插入表格:</span>
      {sizes.map((s) => (
        <button
          key={`${s.rows}x${s.cols}`}
          className="px-2 py-1 text-xs rounded theme-bg-secondary hover:opacity-80"
          onClick={() => onInsertTable(s)}
        >
          {s.rows}×{s.cols}
        </button>
      ))}
    </div>
  );
};

const CaptureEditorPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  useMemo(() => {
    (window as any).__LEXICAL_EDITOR__ = editor;
    return editor;
  }, [editor]);
  return null;
};

export const LexicalEditor: React.FC = () => {
  const [html, setHtml] = useState('');

  const initialConfig = useMemo(
    () => ({
      namespace: 'anning-lexical',
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        TableNode,
        TableRowNode,
        TableCellNode,
      ],
      onError: (e: any) => console.error('[Lexical] error:', e),
      theme: {
        paragraph: '',
        text: {
          bold: 'font-semibold',
          italic: 'italic',
          underline: 'underline',
          code: 'font-mono text-red-500',
        },
        table: 'anning-table',
        tableCell: 'anning-table-cell',
        tableRow: 'anning-table-row',
      },
    }),
    []
  );

  const handleChange = useCallback((editorState: any, editor: any) => {
    editorState.read(() => {
      try {
        const htmlString = $generateHtmlFromNodes(editor, null);
        setHtml(htmlString);
      } catch {}
    });
  }, []);

  const handleInsertTable = useCallback((editor: any, size: TableSize) => {
    const { rows, cols } = size;
    editor.update(() => {
      const table = new TableNode();
      for (let i = 0; i < rows; i++) {
        const row = new TableRowNode();
        for (let j = 0; j < cols; j++) {
          const cell = new TableCellNode();
          row.append(cell);
        }
        table.append(row);
      }
      $insertNodes([table]);
    });
  }, []);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-h-[400px]">
        <LexicalComposer initialConfig={initialConfig}>
          <div className="flex flex-col h-full">
            <Toolbar onInsertTable={(s) => {
              const editor = (window as any).__LEXICAL_EDITOR__;
              if (editor) handleInsertTable(editor, s);
            }} />
            <div className="p-3 flex-1 overflow-auto">
              <RichTextPlugin contentEditable={<ContentEditable className="min-h-[260px] outline-none" />} placeholder={<Placeholder />} ErrorBoundary={LexicalErrorBoundary} />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <TablePlugin />
              <AutoFocusPlugin />
              <OnChangePlugin onChange={handleChange} />
              <CaptureEditorPlugin />
              <FloatingToolbar />
              <SlashMenu onInsertTable={(r,c)=>{
                const editor = (window as any).__LEXICAL_EDITOR__;
                if (editor) handleInsertTable(editor, {rows:r, cols:c});
              }} />
            </div>
          </div>
        </LexicalComposer>
      </div>
      <div className="w-[40%] border-l theme-border-primary p-3 overflow-auto">
        <div className="theme-text-secondary text-sm mb-2">HTML 预览</div>
        <pre className="text-xs whitespace-pre-wrap break-words">{html}</pre>
      </div>
    </div>
  );
};

export default LexicalEditor;


