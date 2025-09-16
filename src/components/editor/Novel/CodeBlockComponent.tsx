import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { common, createLowlight } from 'lowlight';

// 创建 lowlight 实例并注册支持的语言
const lowlight = createLowlight(common);

// 导入额外的语言支持
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';

// 注册语言
lowlight.register({ sql, java, python, bash, javascript, typescript, go, rust });

const SUPPORTED_LANGUAGES = [
  { value: '', label: '无语言' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

interface CodeBlockComponentProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  selected: boolean;
}

export const CodeBlockComponent: React.FC<CodeBlockComponentProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = node.attrs.language || '';
  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((lang) => lang.value === currentLanguage)?.label || '无语言';

  const handleLanguageChange = useCallback(
    (language: string) => {
      updateAttributes({ language });
      setShowLanguageSelect(false);
    },
    [updateAttributes]
  );

  const handleCopy = useCallback(async () => {
    const codeText = node.textContent || '';
    try {
      await navigator.clipboard.writeText(codeText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [node]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageSelect(false);
      }
    };

    if (showLanguageSelect) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageSelect]);

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div
        className={`
          relative group rounded-xl ml-4
          ${selected ? 'ring-2 ring-blue-400/50' : ''}
        `}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* 代码内容区域 */}
        <div className="relative rounded-xl">
          {/* 代码内容区域背景 - 带圆角裁�?*/}
          <div className="relative rounded-xl overflow-hidden">
            {/* 代码内容背景装饰 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%)',
                opacity: 0.6,
              }}
            />

            {/* 内容padding容器 */}
            <div className="px-4 py-3 pr-20">
              {/* 代码内容滚动容器 */}
              <div className="overflow-x-auto">
                <NodeViewContent
                  className={`hljs font-mono text-sm theme-text-primary min-h-[1.5rem] whitespace-pre outline-none ${
                    currentLanguage ? `language-${currentLanguage}` : ''
                  }`}
                  style={{
                    backgroundColor: 'transparent !important',
                    background: 'transparent !important',
                    border: 'none',
                    resize: 'none',
                    lineHeight: '1.4',
                    letterSpacing: '0.025em',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    margin: 0,
                    padding: 0,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]">
            {/* 语言选择�?*/}
            <div className="relative">
              <button
                onClick={() => setShowLanguageSelect(!showLanguageSelect)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs theme-text-secondary hover:theme-text-primary transition-all duration-200 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                title={`语言: ${currentLanguageLabel}`}
              >
                <span className="font-mono font-medium">{currentLanguageLabel}</span>
                <ChevronDown size={16} />
              </button>

              {showLanguageSelect && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full right-0 mt-1 w-36 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow:
                      '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    zIndex: 9999,
                  }}
                >
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value)}
                        className={`
                          w-full text-left px-3 py-2 text-xs transition-all duration-150 font-mono
                          ${
                            lang.value === currentLanguage
                              ? 'theme-text-primary font-semibold'
                              : 'theme-text-secondary hover:theme-text-primary'
                          }
                        `}
                        style={{
                          background:
                            lang.value === currentLanguage
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'transparent',
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 复制按钮 */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs theme-text-secondary hover:theme-text-primary transition-all duration-200 rounded-lg"
              style={{
                background: copySuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                border: copySuccess
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              {copySuccess ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400 font-medium">已复制</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="font-medium">复制</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
