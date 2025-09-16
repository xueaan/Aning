import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useDialogueContextStore } from '@/stores';
import {
  MentionDetection,
  SuggestionGroups,
  DEFAULT_CONTEXT_CONFIG,
  ContextItem,
} from '@/types/dialogue';
import { MentionEngine } from '@/utils/mentionEngine';
import { debounceSearch } from '@/services/suggestionService';
import { MentionDropdown } from './MentionDropdown';
import { ContextTags } from './ContextTags';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showImageUpload?: boolean;
  onImageUploadToggle?: () => void;
  className?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = '输入消息，使用 @ 添加知识库页面或任务到上下文...',
  maxLength = 2000,
  showImageUpload = false,
  onImageUploadToggle,
  className = '',
}) => {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 状态管理
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionGroups | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [currentMention, setCurrentMention] = useState<MentionDetection | null>(null);
  const [isComposing, setIsComposing] = useState(false); // 处理中文输入法

  // Context store
  const { activeContexts, loadContextFromMention, removeContext, stats } =
    useDialogueContextStore();

  const activeContextsList = Array.from(activeContexts.values());

  // 检测@提及
  const detectMentionInInput = useCallback(
    (text: string, cursorPos?: number) => {
      if (isComposing) return null;

      const detection = MentionEngine.detectMention(text, cursorPos);
      if (detection && detection.query.length >= 0) {
        return detection;
      }
      return null;
    },
    [isComposing]
  );

  // 处理建议搜索
  const handleSearchSuggestions = useCallback((query: string) => {
    if (!query && query !== '') {
      setShowSuggestions(false);
      setSuggestions(null);
      return;
    }

    debounceSearch(
      query,
      (results) => {
        setSuggestions(results);
        setShowSuggestions(results.total > 0);
        setSelectedSuggestionIndex(0);
      },
      DEFAULT_CONTEXT_CONFIG.DEBOUNCE_MS,
      'smart-input'
    );
  }, []);

  // 处理文本变化
  const handleTextChange = useCallback(
    (newValue: string) => {
      if (newValue.length > maxLength) {
        return;
      }

      onChange(newValue);

      // 检测@提及
      const cursorPos = textareaRef.current?.selectionStart;
      const mention = detectMentionInInput(newValue, cursorPos);

      if (mention) {
        setCurrentMention(mention);
        handleSearchSuggestions(mention.query);
      } else {
        setCurrentMention(null);
        setShowSuggestions(false);
        setSuggestions(null);
      }
    },
    [onChange, maxLength, detectMentionInInput, handleSearchSuggestions]
  );

  // 处理建议选择
  const handleSelectSuggestion = useCallback(
    async (suggestionValue: string, _displayText?: string) => {
      if (!currentMention || !textareaRef.current) {
        return;
      }

      const textarea = textareaRef.current;
      const beforeMention = value.substring(0, currentMention.start);
      const afterMention = value.substring(currentMention.end);

      // 构建新文本（暂时保留@提及，在发送时处理）
      const newValue = beforeMention + suggestionValue + ' ' + afterMention;

      // 更新输入框内容
      onChange(newValue);

      // 尝试加载上下文
      try {
        const contextResult = await loadContextFromMention(suggestionValue);
        if (!contextResult.success) {
          console.error('❌ 上下文添加失败:', contextResult.error);
        }
      } catch (error) {
        console.error('加载上下文异常:', error);
      }

      // 重新聚焦并设置光标位置
      const newCursorPos = beforeMention.length + suggestionValue.length + 1;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);

      // 隐藏建议
      setShowSuggestions(false);
      setSuggestions(null);
      setCurrentMention(null);
      setSelectedSuggestionIndex(0);
    },
    [currentMention, value, onChange, loadContextFromMention]
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 如果正在输入中文，忽略大部分快捷键
      if (isComposing) {
        if (e.key === 'Escape') {
          setShowSuggestions(false);
        }
        return;
      }

      if (showSuggestions && suggestions) {
        const flatSuggestions = suggestions.groups.flatMap((g) => g.items);

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestionIndex((prev) =>
              prev < flatSuggestions.length - 1 ? prev + 1 : 0
            );
            break;

          case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestionIndex((prev) =>
              prev > 0 ? prev - 1 : flatSuggestions.length - 1
            );
            break;

          case 'Tab':
          case 'Enter':
            if (e.key === 'Enter' && e.shiftKey) {
              // Shift+Enter 换行，不处理
              break;
            }

            e.preventDefault();
            const selectedSuggestion = flatSuggestions[selectedSuggestionIndex];
            if (selectedSuggestion) {
              handleSelectSuggestion(selectedSuggestion.value, selectedSuggestion.label);
            }
            break;

          case 'Escape':
            e.preventDefault();
            setShowSuggestions(false);
            setSuggestions(null);
            setCurrentMention(null);
            break;
        }
      } else {
        // 没有建议时的快捷键处理
        if (e.key === 'Enter' && !e.shiftKey && !disabled) {
          e.preventDefault();
          onSend();
        }
      }
    },
    [
      showSuggestions,
      suggestions,
      selectedSuggestionIndex,
      handleSelectSuggestion,
      disabled,
      onSend,
      isComposing,
    ]
  );

  // 处理点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动调整textarea高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = Math.min(textarea.scrollHeight, 120); // 最大高度120px
      textarea.style.height = scrollHeight + 'px';
    }
  }, [value]);

  // 处理粘贴事件（支持图片和智能文字检测）
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. 检查图片文件
      if (clipboardData.files.length > 0) {
        const files = Array.from(clipboardData.files);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
          e.preventDefault();
          // 不自动打开上传界面，只是阻止默认行为
          // 让全局监听器处理图片转换和添加
          return;
        }
      }

      // 2. 检查文字内容，如果是长文本则自动添加到上下文
      const text = clipboardData.getData('text/plain');
      if (text && text.length > 100) {
        // 长于100字符的文本
        try {
          // 创建一个临时上下文项
          const contextItem: ContextItem = {
            id: `clipboard_${Date.now()}`,
            type: 'knowledge_page', // 使用knowledge_page类型
            title: '剪贴板内容',
            content: text,
            source: {
              module: 'knowledge',
              id: `clipboard_${Date.now()}`,
            },
            addedAt: Date.now(),
            tokenCount: Math.ceil(text.length / 4), // 简单估算token数
            metadata: {
              kb_name: '剪贴板',
              created_at: new Date().toISOString(),
            },
          };

          // 添加到上下文
          const { addContext } = useDialogueContextStore.getState();
          addContext(contextItem);

          // 阻止默认粘贴行为，因为我们已经添加到上下文了
          e.preventDefault();

          // 长文本已添加到上下文
        } catch (error) {
          console.error('添加剪贴板内容到上下文失败:', error);
          // 如果失败，允许默认粘贴行为
        }
      }
    },
    [onImageUploadToggle]
  );

  // 计算剩余字符数
  const remainingChars = maxLength - value.length;
  const showCharCount = remainingChars <= 100;

  // 是否可以发送
  const canSend = value.trim().length > 0 && !disabled && remainingChars >= 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 上下文标签 */}
      {activeContextsList.length > 0 && (
        <div className="mb-3">
          <ContextTags contexts={activeContextsList} onRemove={removeContext} stats={stats} />
        </div>
      )}

      {/* 输入区域 */}
      <div className="relative rounded-lg focus-within:theme-border-accent transition-colors feather-glass-panel">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm theme-text-primary placeholder:theme-text-secondary resize-none min-h-[44px] max-h-[120px] bg-transparent border-0 focus:outline-none disabled:opacity-50 rounded-lg pr-20"
          style={{ height: 'auto' }}
        />

        {/* 右侧工具栏 */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {/* 字符计数 */}
          {showCharCount && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                remainingChars < 0
                  ? 'theme-text-error'
                  : remainingChars <= 50
                    ? 'theme-warning'
                    : 'theme-text-secondary'
              }`}
            >
              {remainingChars}
            </span>
          )}

          {/* 图片上传按钮 */}
          {onImageUploadToggle && (
            <button
              onClick={onImageUploadToggle}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                showImageUpload
                  ? 'theme-bg-accent/10 theme-text-accent'
                  : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary/50'
              }`}
              title={showImageUpload ? '关闭图片上传' : '上传图片'}
            >
              <Paperclip size={16} />
            </button>
          )}

          {/* 发送按钮 */}
          <button
            onClick={onSend}
            disabled={!canSend}
            className={`p-2.5 rounded-lg transition-colors ${
              canSend
                ? 'theme-bg-accent theme-text-primary hover:theme-bg-accent-hover'
                : 'theme-bg-secondary/50 theme-text-secondary dark:theme-text-secondary cursor-not-allowed opacity-50'
            }`}
            title={disabled ? 'AI正在回复中...' : '发送消息 (Enter)'}
          >
            {disabled ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      {/* 建议下拉框 */}
      {showSuggestions && suggestions && (
        <MentionDropdown
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
          onSelect={handleSelectSuggestion}
          onClose={() => setShowSuggestions(false)}
          className="absolute bottom-full left-0 right-0 mb-1 z-50"
        />
      )}

      {/* 底部信息栏：tokens统计 */}
      {activeContexts.size > 0 && (
        <div className="mt-2 flex justify-between items-center">
          {/* 左侧：丸面是空的 */}
          <div className="flex items-center gap-2"></div>
          <div className="text-xs theme-text-secondary">
            {activeContexts.size > 0 && (
              <span>
                {stats.totalItems} 项 · 约 {stats.totalTokens} tokens
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
