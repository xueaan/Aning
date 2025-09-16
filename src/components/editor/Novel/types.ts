export interface NovelEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  height?: number;
  readOnly?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export interface NovelEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  blur: () => void;
  getHTML: () => string;
  getMarkdown: () => string;
  insertText: (text: string) => void;
  undo: () => void;
  redo: () => void;
  // 新增：格式化命令
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  toggleCode: () => void;
  toggleHeading: (level: 1 | 2 | 3) => void;
  setParagraph: () => void;
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  toggleBullet: () => void;
  toggleOrdered: () => void;
  toggleBlockquote: () => void;
  toggleCodeBlock: () => void;
  // 新增：状态查询
  isActive: (name: string, attrs?: any) => boolean;
  // 新增：插入图片
  insertImage: (src: string) => void;
  // 暴露编辑器实例
  getEditor: () => any;
}
