// Temporary stubs for experimental Lexical editor modules to keep typecheck green
declare module '@lexical/react/LexicalComposer' {
  export const LexicalComposer: any;
  export const RichTextPlugin: any;
  export const ContentEditable: any;
  export const HistoryPlugin: any;
}
declare module '@lexical/react/LexicalListPlugin' { export const ListPlugin: any }
declare module '@lexical/react/LexicalLinkPlugin' { export const LinkPlugin: any }
declare module '@lexical/react/LexicalTablePlugin' { export const TablePlugin: any }
declare module '@lexical/react/LexicalCodePlugin' { export const CodePlugin: any }
declare module '@lexical/react/LexicalAutoFocusPlugin' { export const AutoFocusPlugin: any }
declare module '@lexical/react/LexicalOnChangePlugin' { export const OnChangePlugin: any }
declare module '@lexical/html' { export const $generateHtmlFromNodes: any; export const $generateNodesFromDOM: any }
declare module '@lexical/rich-text' { export const HeadingNode: any; export const QuoteNode: any }
declare module '@lexical/list' { export const ListItemNode: any; export const ListNode: any }
declare module '@lexical/table' { export const TableCellNode: any; export const TableNode: any; export const TableRowNode: any }
declare module '@lexical/code' { export const CodeNode: any }
declare module 'lexical' {
  export const $getRoot: any;
  export const $insertNodes: any;
  export const CLEAR_HISTORY_COMMAND: any;
  export const $getSelection: any;
  export const $isRangeSelection: any;
  export const FORMAT_TEXT_COMMAND: any;
  export const KEY_DOWN_COMMAND: any;
}
declare module '@lexical/rich-text' {
  export const HeadingNode: any; export const QuoteNode: any;
  export const $createHeadingNode: any; export const $createQuoteNode: any;
}
declare module '@lexical/list' {
  export const ListItemNode: any; export const ListNode: any;
  export const INSERT_UNORDERED_LIST_COMMAND: any; export const INSERT_ORDERED_LIST_COMMAND: any;
}
declare module '@lexical/code' { export const CodeNode: any; export const $createCodeNode: any }

