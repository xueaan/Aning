'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SimpleInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  themeMode?: 'modern' | 'classic';
  minHeight?: number;
  height?: number;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface SimpleInputRef {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  blur: () => void;
}

export const SimpleInput = forwardRef<SimpleInputRef, SimpleInputProps>(({
  value = '',
  onChange,
  onSave,
  placeholder = '开始输入...',
  className = '',
  // theme = 'light',
  // themeMode = 'modern',
  minHeight = 120,
  height,
  editable = true,
  onFocus,
  onBlur
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(minHeight, height || scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // 处理内容变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  // 处理快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      onSave?.();
    }
  };

  // 暴露ref方法
  useImperativeHandle(ref, () => ({
    getValue: () => value,
    setValue: (newValue: string) => onChange(newValue),
    focus: () => textareaRef.current?.focus(),
    blur: () => textareaRef.current?.blur()
  }), [value, onChange]);

  // 计算主题
  // const getActualTheme = (): 'light' | 'dark' => {
  //   if (theme === 'auto') {
  //     return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  //   }
  //   return theme;
  // };

  // const actualTheme = getActualTheme();

  // 当值变化时调整高度
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // 组件挂载时调整高度
  useEffect(() => {
    adjustHeight();
  }, []);

  return (
    <textarea ref={textareaRef} value={value}
      onChange={handleChange} onKeyDown={handleKeyDown}
          onFocus={onFocus} onBlur={onBlur}
          placeholder={placeholder} readOnly={!editable}
          
            className={cn(
        // 基础样式
        'w-full resize-none overflow-hidden border-none outline-none transition-all duration-200',
        
        // 字体和间距
        'text-sm leading-relaxed p-3',
        
        // 主题样式
        'theme-text-primary theme-bg-secondary/50 backdrop-blur-sm',
        'placeholder:theme-text-tertiary',
        
        // 焦点状态
        'focus:ring-2 focus:ring-primary-500/20',
        
        // 禁用状态
        !editable && 'cursor-default opacity-75',
        
        className
      )} style={{
        minHeight: `${minHeight}px`,
        height: height ? `${height}px` : undefined
      }}
    />
  );
});

SimpleInput.displayName = 'SimpleInput';

export default SimpleInput;










