import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Block as BackendBlock } from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useKnowledgeOperations } from '@/stores/knowledgeStore';
import { NovelEditor, type NovelEditorRef } from '@/components/editor/Novel';
import { RichEditorToolbar } from '@/components/editor/RichEditorToolbar';
import { Eye, FolderOpen } from 'lucide-react';
import { debounce } from '@/utils/debounce';
import { DatabaseAPI } from '@/services/api/database';
import { extractHeadings, getActiveHeadingId, type OutlineItem } from './HeadingExtractor';

interface BlockEditorProps {
  knowledgeBaseId?: string;
  pageId: string | null;
  initialBlocks?: BackendBlock[];
  onBlocksChange?: (blocks: Partial<BackendBlock>[]) => void;
  onHeadingsChange?: (headings: OutlineItem[]) => void;
  onOutlineToggle?: (visible: boolean) => void;
  isOutlineVisible?: boolean;
  onKnowledgeTreeToggle?: (visible: boolean) => void;
  isKnowledgeTreeVisible?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  pageId,
  onBlocksChange,
  onHeadingsChange,
  onOutlineToggle,
  isOutlineVisible = false,
  onKnowledgeTreeToggle,
  isKnowledgeTreeVisible = false,
  className = '',
  readOnly = false,
}) => {
  const editorRef = useRef<NovelEditorRef>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // 大纲相关状态
  const [headings, setHeadings] = useState<OutlineItem[]>([]);
  // const [activeHeadingId, setActiveHeadingId] = useState<string>(''); // 暂时未使用

  const { theme } = useAppStore();
  const knowledgeOps = useKnowledgeOperations();

  // 加载页面内容
  const loadContent = async (pid: string) => {
    if (!pid) return;

    try {
      setIsLoading(true);
      // 从数据库加载页面的块内容
      const blocks = await DatabaseAPI.getBlocks(pid);

      if (blocks && blocks.length > 0) {
        // 如果有块数据，合并所有块的内容
        const htmlContent = blocks
          .sort((a, b) => a.order_index - b.order_index)
          .map((block) => {
            // 根据块类型转换为HTML
            switch (block.block_type) {
              case 'heading':
                return `<h2>${block.content}</h2>`;
              case 'paragraph':
              default:
                return `<p>${block.content}</p>`;
            }
          })
          .join('\n');

        const finalContent = htmlContent || '<p></p>';
        setEditorContent(finalContent);

        // 立即提取标题
        if (onHeadingsChange && finalContent !== '<p></p>') {
          try {
            const headings = extractHeadings(finalContent);
            onHeadingsChange(headings);
          } catch (error) {
            onHeadingsChange([]);
          }
        }

        // 同时提取标题给浮动大纲
        if (finalContent !== '<p></p>') {
          try {
            const outlineHeadings = extractHeadings(finalContent);
            setHeadings(outlineHeadings);
          } catch (error) {
            setHeadings([]);
          }
        } else {
          setHeadings([]);
        }
      } else {
        // 如果没有块数据，尝试从页面标题创建初始内容

        // 尝试从知识库操作中获取当前页面信息
        const currentPage = knowledgeOps.pages.find((p) => p.id === pid);
        if (
          currentPage &&
          currentPage.title &&
          currentPage.title.trim() !== '' &&
          !currentPage.title.startsWith('新页面')
        ) {
          // 如果页面有标题且不是默认的"新页面"，使用标题作为初始内容
          const initialContent = `<h2>${currentPage.title}</h2><p></p>`;
          setEditorContent(initialContent);

          // 自动保存这个初始内容到数据库
          try {
            await DatabaseAPI.createBlock(pid, 'heading', currentPage.title);
            await DatabaseAPI.createBlock(pid, 'paragraph', '');
          } catch (error) {}
        } else {
          // 显示空内容
          setEditorContent('<p></p>');
        }

        // 清空标题
        if (onHeadingsChange) {
          onHeadingsChange([]);
        }
        // 清空浮动大纲标题
        setHeadings([]);
      }
    } catch (error) {
      console.error('Failed to load page content:', error);
      setEditorContent('<p>加载失败，请刷新重试</p>');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存页面内容
  const saveContent = async (content: string) => {
    if (!pageId || isSaving) return;

    setIsSaving(true);
    try {
      // 获取现有的块
      const existingBlocks = await DatabaseAPI.getBlocks(pageId);

      if (existingBlocks.length > 0) {
        // 如果已有块，更新第一个块的内容
        const firstBlock = existingBlocks[0];
        await DatabaseAPI.updateBlock(firstBlock.id, content);
      } else {
        // 如果没有块，创建一个新的段落块
        await DatabaseAPI.createBlock(pageId, 'paragraph', content);
      }

      // 通知父组件数据变化（用于兼容）
      if (onBlocksChange) {
        try {
          const blocks: Partial<BackendBlock>[] = [
            {
              id: existingBlocks.length > 0 ? existingBlocks[0].id : `${pageId}-new`,
              page_id: pageId,
              block_type: 'paragraph',
              content: content,
              order_index: 0,
              updated_at: Date.now(),
            },
          ];
          onBlocksChange(blocks);
        } catch (error) {
          console.warn('Failed to convert Novel data to blocks:', error);
        }
      }

      // Content saved successfully
    } catch (error) {
      console.error('Failed to save page content:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 防抖自动保存函数
  const debouncedAutoSave = useCallback(
    debounce(async (content: string) => {
      if (knowledgeOps.autoSaveEnabled && !readOnly && content.trim()) {
        try {
          await saveContent(content);
        } catch (error) {
          console.warn('Auto-save failed:', error);
          // 自动保存失败时不抛出错误，避免影响用户体验
        }
      }
    }, 2000), // 2秒防抖
    [pageId, knowledgeOps.autoSaveEnabled, readOnly]
  );

  // 防抖提取标题函数
  const debouncedExtractHeadings = useCallback(
    debounce((content: string) => {
      if (onHeadingsChange && content) {
        try {
          const headings = extractHeadings(content);
          onHeadingsChange(headings);
        } catch (error) {
          onHeadingsChange([]);
        }
      }
    }, 500), // 0.5秒防抖
    [onHeadingsChange]
  );

  // 更新工具栏活跃状态
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;

    const formats: string[] = [];
    const editor = editorRef.current;

    // 检查文本格式
    if (editor.isActive('bold')) formats.push('bold');
    if (editor.isActive('italic')) formats.push('italic');
    if (editor.isActive('strike')) formats.push('strike');
    if (editor.isActive('code')) formats.push('code');

    // 检查标题级别
    if (editor.isActive('heading', { level: 1 })) formats.push('heading1');
    if (editor.isActive('heading', { level: 2 })) formats.push('heading2');
    if (editor.isActive('heading', { level: 3 })) formats.push('heading3');

    // 检查段落
    if (editor.isActive('paragraph')) formats.push('paragraph');

    // 检查对齐
    if (editor.isActive('textAlign', { textAlign: 'left' })) formats.push('left');
    if (editor.isActive('textAlign', { textAlign: 'center' })) formats.push('center');
    if (editor.isActive('textAlign', { textAlign: 'right' })) formats.push('right');

    // 检查列表和块
    if (editor.isActive('bullet')) formats.push('bullet');
    if (editor.isActive('ordered')) formats.push('ordered');
    if (editor.isActive('blockquote')) formats.push('blockquote');
    if (editor.isActive('codeBlock')) formats.push('codeBlock');

    setActiveFormats(formats);
  }, []);

  // 防抖更新活跃格式
  const debouncedUpdateFormats = useCallback(
    debounce(() => {
      updateActiveFormats();
    }, 100),
    [updateActiveFormats]
  );

  // 防抖提取标题给浮动大纲
  const debouncedExtractHeadingsForOutline = useCallback(
    debounce((content: string) => {
      if (content) {
        try {
          const extractedHeadings = extractHeadings(content);
          setHeadings(extractedHeadings);
        } catch (error) {
          setHeadings([]);
        }
      } else {
        setHeadings([]);
      }
    }, 500),
    []
  );

  // 处理编辑器内容变化
  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);

    // 标记有未保存的更改
    if (!knowledgeOps.hasUnsavedChanges && newContent !== editorContent) {
      // Note: We don't have a direct setter, so we'll manage state locally
    }

    // 触发防抖自动保存
    if (knowledgeOps.autoSaveEnabled && !readOnly) {
      debouncedAutoSave(newContent);
    }

    // 触发防抖标题提取（兼容旧的回调）
    debouncedExtractHeadings(newContent);

    // 触发防抖标题提取（给浮动大纲用）
    debouncedExtractHeadingsForOutline(newContent);

    // 更新工具栏状态
    debouncedUpdateFormats();
  };

  // 处理手动保存
  const handleSave = async () => {
    if (editorRef.current) {
      try {
        const content = await editorRef.current.getValue();
        await saveContent(content);
      } catch (error) {
        console.error('Failed to save:', error);
      }
    }
  };

  // 当 pageId 变化时加载内容
  useEffect(() => {
    if (pageId) {
      // 重置状态（managing locally since we don't have direct setter)
      // 加载页面内容
      loadContent(pageId);
    } else {
      // 清空编辑器内容
      setEditorContent('');
      // 清空标题
      if (onHeadingsChange) {
        onHeadingsChange([]);
      }
      // 清空浮动大纲标题
      setHeadings([]);
    }
  }, [pageId]);

  // 监听滚动更新活跃标题
  useEffect(() => {
    const updateActiveHeading = () => {
      getActiveHeadingId(headings.map((h) => h.id));
      // 暂时注释掉，等后续需要时再启用
    };

    const handleScroll = debounce(updateActiveHeading, 100);

    // 监听编辑器容器的滚动
    const editorContainer = document.querySelector('.knowledge-editor .ProseMirror');
    if (editorContainer) {
      editorContainer.addEventListener('scroll', handleScroll);
      return () => {
        editorContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [headings]);

  // 如果没有选中页面，显示占位符
  if (!pageId) {
    const isDark = theme === 'dark';
    const placeholderBg = 'theme-bg-secondary/20';
    const placeholderText = 'theme-text-tertiary';
    const iconColor = 'theme-text-secondary';
    const subtitleColor = isDark ? 'text-gray-400' : 'text-gray-400';

    return (
      <div
        className={cn(
          'flex-1 flex items-center justify-center',
          placeholderText,
          placeholderBg,
          className
        )}
      >
        <div className="text-center">
          <svg
            className={`w-16 h-16 mx-auto mb-4 ${iconColor}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">选择一个页面开始编辑</h3>
          <p className={`text-sm ${subtitleColor}`}>从左侧选择已有页面，或创建新页面</p>
        </div>
      </div>
    );
  }

  // 显示加载状态
  if (isLoading) {
    const isDark = theme === 'dark';
    const containerBg = isDark ? 'bg-black/20' : 'bg-white/20';

    return (
      <div className={cn('flex-1 flex items-center justify-center', containerBg, className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">正在加载页面内容...</span>
        </div>
      </div>
    );
  }

  // 处理图片插入
  const handleInsertImage = (base64: string) => {
    if (!editorRef.current) return;

    editorRef.current.insertImage(base64);
    // 图片插入后，编辑器内容变化会自动触发 handleContentChange 中的自动保存
  };

  // 处理工具栏格式化
  const handleFormat = (format: string) => {
    if (!editorRef.current) return;

    switch (format) {
      case 'bold':
        editorRef.current.toggleBold();
        break;
      case 'italic':
        editorRef.current.toggleItalic();
        break;
      case 'strike':
        editorRef.current.toggleStrike();
        break;
      case 'code':
        editorRef.current.toggleCode();
        break;
      case 'heading1':
        editorRef.current.toggleHeading(1);
        break;
      case 'heading2':
        editorRef.current.toggleHeading(2);
        break;
      case 'heading3':
        editorRef.current.toggleHeading(3);
        break;
      case 'paragraph':
        editorRef.current.setParagraph();
        break;
      case 'left':
        editorRef.current.setTextAlign('left');
        break;
      case 'center':
        editorRef.current.setTextAlign('center');
        break;
      case 'right':
        editorRef.current.setTextAlign('right');
        break;
      case 'bullet':
        editorRef.current.toggleBullet();
        break;
      case 'ordered':
        editorRef.current.toggleOrdered();
        break;
      case 'blockquote':
        editorRef.current.toggleBlockquote();
        break;
      case 'codeBlock':
        editorRef.current.toggleCodeBlock();
        break;
      default:
        console.warn('Unknown format:', format);
    }
  };

  return (
    <div className={cn('flex-1 flex flex-col relative', 'bg-transparent', className)}>
      {/* 顶部工具栏 - 与大纲按钮对齐 */}
      <div className="sticky top-0 z-20">
        <div className="flex items-start justify-between px-6 py-3">
          {/* 左侧按钮 - 目录 */}
          <div className="flex-shrink-0 mr-4">
            <button
              onClick={() => onKnowledgeTreeToggle?.(!isKnowledgeTreeVisible)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm',
                'theme-bg-secondary/50 hover:theme-bg-secondary',
                'theme-text-secondary hover:theme-text-primary',
                'border theme-border-primary'
              )}
            >
              <FolderOpen className="w-4 h-4" />
              <span>目录</span>
            </button>
          </div>

          {/* 中间工具栏 */}
          <div className="flex-1 min-w-0">
            <RichEditorToolbar
              onFormat={handleFormat}
              onInsertImage={handleInsertImage}
              activeFormats={activeFormats}
              className="bg-transparent border-none shadow-none"
            />
          </div>

          {/* 右侧按钮 - 大纲 */}
          <div className="flex-shrink-0 ml-4">
            {headings.length > 0 && (
              <button
                onClick={() => onOutlineToggle?.(!isOutlineVisible)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm',
                  'theme-bg-secondary/50 hover:theme-bg-secondary',
                  'theme-text-secondary hover:theme-text-primary',
                  'border theme-border-primary'
                )}
              >
                <Eye className="w-4 h-4" />
                <span>大纲</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑器内容区域 - 完全融入背景 */}
      <div className="flex-1 overflow-y-auto">
        <NovelEditor
          ref={editorRef}
          value={editorContent}
          onChange={handleContentChange}
          onSave={handleSave}
          placeholder="开始书写你的想法..."
          readOnly={readOnly}
          theme={theme}
          className="w-full min-h-full knowledge-editor"
        />
      </div>
    </div>
  );
};
