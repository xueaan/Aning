import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { processImageUpload } from '@/utils/imageUtils';
import { Bold, Italic, Underline, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, CheckSquare, Quote, Minus, Link, Image, Code2 } from 'lucide-react';

interface RichEditorToolbarProps {
  onFormat?: (format: string) => void;
  onInsertImage?: (base64: string) => void;
  activeFormats?: string[];
  className?: string;
}

export const RichEditorToolbar: React.FC<RichEditorToolbarProps> = ({
  onFormat,
  onInsertImage,
  activeFormats = [],
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toolbarGroups = [
    // 标题组
    {
      name: 'headings',
      items: [
        { key: 'heading1', icon: Heading1, tooltip: '标题 1' },
        { key: 'heading2', icon: Heading2, tooltip: '标题 2' },
        { key: 'heading3', icon: Heading3, tooltip: '标题 3' }
      ]
    },
    // 格式化组
    {
      name: 'formatting',
      items: [
        { key: 'bold', icon: Bold, tooltip: '粗体 (⌘B)' },
        { key: 'italic', icon: Italic, tooltip: '斜体 (⌘I)' },
        { key: 'underline', icon: Underline, tooltip: '下划线(⌘U)' }
      ]
    },
    // 对齐组
    {
      name: 'alignment',
      items: [
        { key: 'left', icon: AlignLeft, tooltip: '左对齐' },
        { key: 'center', icon: AlignCenter, tooltip: '居中' },
        { key: 'right', icon: AlignRight, tooltip: '右对齐' }
      ]
    },
    // 列表和块组
    {
      name: 'blocks',
      items: [
        { key: 'bullet', icon: List, tooltip: '无序列表' },
        { key: 'ordered', icon: ListOrdered, tooltip: '有序列表' },
        { key: 'task', icon: CheckSquare, tooltip: '任务列表' },
        { key: 'blockquote', icon: Quote, tooltip: '引用块' },
        { key: 'divider', icon: Minus, tooltip: '分割线' }
      ]
    },
    // 插入组
    {
      name: 'insert',
      items: [
        { key: 'link', icon: Link, tooltip: '插入链接' },
        { key: 'image', icon: Image, tooltip: '插入图片' },
        { key: 'codeBlock', icon: Code2, tooltip: '代码块' }
      ]
    }
  ];

  // 图片上传处理
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await processImageUpload(file, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        maxSize: 5
      });

      onInsertImage?.(base64);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert(error instanceof Error ? error.message : '图片上传失败，请重试');
    }

    // 重置 input 值以允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = (format: string) => {
    if (format === 'image') {
      fileInputRef.current?.click();
    } else {
      onFormat?.(format);
    }
  };

  const isActive = (format: string) => activeFormats.includes(format);

  return (
    <div className={cn(
      "rich-editor-toolbar",
      "flex items-center gap-1 px-2 py-1.5",
      // 只有在没有传入透明样式时才显示背景
      !className?.includes('bg-transparent') && ["rounded-lg", "theme-bg-secondary/95 backdrop-filter backdrop-blur-sm", "theme-border/20 shadow-lg shadow-black/10 dark:shadow-black/30"],
      "w-full max-w-full",
      className
    )}>
      {toolbarGroups.map((group) => (
        <React.Fragment key={group.name}>
          <div className="flex items-center gap-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.key);

              return (
                <button key={item.key} onClick={() => handleButtonClick(item.key)}
                  
            className={cn(
                    "flex items-center justify-center w-7 h-7 rounded",
                    "transition-all duration-200 ease-out",
                    "theme-text-secondary hover:theme-text-primary",
                    "hover:theme-bg-secondary/50 border border-transparent",
                    active && [
                      "theme-bg-accent/20 theme-text-accent",
                      "theme-border/30"
                    ],
                    !active && "hover:scale-105 active:scale-95"
                  )} title={item.tooltip}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </React.Fragment>
      ))}

      {/* 隐藏的文件输入用于图片上传 */}
      <input ref={fileInputRef} type="file"
        accept="image/*"
        onChange={handleImageUpload} style={{ display: 'none' }}
      />
    </div>
  );
};








