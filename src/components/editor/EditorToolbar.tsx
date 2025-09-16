import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code2,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  onFormat?: (format: string) => void;
  activeFormats?: string[];
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onFormat,
  activeFormats = [],
  className = '',
}) => {
  const toolbarGroups = [
    // 文本格式
    {
      name: 'text',
      items: [
        { key: 'bold', icon: Bold, tooltip: '加粗' },
        { key: 'italic', icon: Italic, tooltip: '斜体' },
        { key: 'strike', icon: Strikethrough, tooltip: '删除线' },
        { key: 'code', icon: Code, tooltip: '行内代码' },
      ],
    },
    // 标题和段落
    {
      name: 'heading',
      items: [
        { key: 'heading1', icon: Heading1, tooltip: '标题 1' },
        { key: 'heading2', icon: Heading2, tooltip: '标题 2' },
        { key: 'heading3', icon: Heading3, tooltip: '标题 3' },
        { key: 'paragraph', icon: Type, tooltip: '正文' },
      ],
    },
    // 对齐
    {
      name: 'align',
      items: [
        { key: 'left', icon: AlignLeft, tooltip: '左对齐' },
        { key: 'center', icon: AlignCenter, tooltip: '居中对齐' },
        { key: 'right', icon: AlignRight, tooltip: '右对齐' },
      ],
    },
    // 列表和引用
    {
      name: 'blocks',
      items: [
        { key: 'bullet', icon: List, tooltip: '无序列表' },
        { key: 'ordered', icon: ListOrdered, tooltip: '有序列表' },
        { key: 'blockquote', icon: Quote, tooltip: '引用' },
        { key: 'codeBlock', icon: Code2, tooltip: '代码块' },
      ],
    },
  ];

  const handleButtonClick = (format: string) => {
    onFormat?.(format);
  };

  const isActive = (format: string) => activeFormats.includes(format);

  return (
    <div
      className={cn(
        'editor-toolbar flex items-center gap-1 px-2 py-1.5 rounded-lg',
        'theme-bg-secondary/90 backdrop-filter backdrop-blur-xl backdrop-saturate-150',
        'theme-border/30 shadow-lg shadow-black/5 dark:shadow-black/20',
        className
      )}
    >
      {toolbarGroups.map((group, groupIndex) => (
        <React.Fragment key={group.name}>
          <div className="flex items-center gap-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.key);

              return (
                <button
                  key={item.key}
                  onClick={() => handleButtonClick(item.key)}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded',
                    'transition-all duration-200 ease-out',
                    'hover:theme-bg-secondary/80 active:scale-95',
                    active && ['theme-bg-accent/20 theme-text-accent', 'theme-border/50'],
                    !active && 'theme-text-secondary'
                  )}
                  title={item.tooltip}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          {groupIndex < toolbarGroups.length - 1 && (
            <div className="w-px h-4 theme-border/40 mx-0.5" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
