import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface LineEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  themeMode?: 'modern' | 'classic';
  minHeight?: number;
  height?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const LineEditor: React.FC<LineEditorProps> = ({
  value,
  onChange,
  onSave,
  placeholder = '开始输入...',
  className = '',
  // themeMode = 'modern',
  minHeight = 120,
  height,
  onFocus,
  onBlur
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整 textarea 高度
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(minHeight, textareaRef.current.scrollHeight)}px`;
    }
  };

  // 处理内容变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // 延迟调整高度，避免卡顿
    setTimeout(adjustTextareaHeight, 0);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      onSave?.();
    }
  };

  // 处理聚焦
  const handleFocus = () => {
    onFocus?.();
  };

  // 处理失焦
  const handleBlur = () => {
    onBlur?.();
  };

  // 初次加载时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, minHeight]);

  return (
    <div className={cn('line-editor', className)}>
      <div className="textarea-container relative bg-transparent border-none">
        <textarea 
          ref={textareaRef} 
          value={value}
          onChange={handleChange} 
          onKeyDown={handleKeyDown}
          onFocus={handleFocus} 
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'w-full p-3 bg-transparent border-none outline-none resize-none text-sm transition-colors ring-0 focus:ring-0 shadow-none',
            'placeholder:theme-text-secondary',
            'theme-text-primary',
            className
          )}
          style={{
            minHeight: `${minHeight}px`,
            height: height ? `${height}px` : undefined,
            lineHeight: '1.6'
          }}
        />
      </div>
    </div>
  );
};

export default LineEditor;
