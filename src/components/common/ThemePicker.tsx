import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '@/stores';
import { gradientThemes } from '@/utils/gradientThemes';
import { Palette, X, Check } from 'lucide-react';
import { getBlendModeLabel } from '@/utils/colorBlend';

export const ThemePicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    theme,
    gradientTheme,
    noiseLevel,
    gradientAngle,
    blendMode,
    setTheme,
    setGradientTheme,
    setNoiseLevel,
    setGradientAngle,
    setBlendMode
  } = useAppStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在按钮或面板外部
      if (
        isOpen && buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleThemeSelect = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  const handleGradientSelect = (gradientId: string) => {
    setGradientTheme(gradientId);
  };

  const handleNoiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoiseLevel(Number(e.target.value));
  };

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGradientAngle(Number(e.target.value));
  };

  const handleBlendModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlendMode(Number(e.target.value));
  };

  return (
    <div className="relative">
      {/* 主题按钮 */}
      <button ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="btn-toolbar w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 tooltip-up"
        title="主题设置"
        style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}
      >
        <Palette size={16} />
      </button>

      {isOpen && ReactDOM.createPortal(
        <div ref={panelRef}
          className="fixed w-80 rounded-xl shadow-2xl p-4 z-[99999] feather-glass-content animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            bottom: '50px',
            left: '10px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
          }}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium theme-text-primary">主题设置</h3>
            <button onClick={() => setIsOpen(false)}
              className="btn-icon p-1 theme-text-secondary hover:theme-text-primary transition-all duration-200 hover:scale-110 hover:rotate-90 active:scale-90"
            >
              <X size={16} />
            </button>
          </div>

          {/* 主题选择 */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => handleThemeSelect('auto')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs transition-all hover:scale-102 active:scale-98 ${
                theme === 'auto'
                  ? 'theme-bg-accent theme-text-smart-contrast'
                  : 'theme-bg-secondary theme-text-primary hover:theme-bg-secondary-hover'
              }`}
            >
              通用
            </button>
            <button onClick={() => handleThemeSelect('light')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs transition-all hover:scale-102 active:scale-98 ${
                theme === 'light'
                  ? 'theme-bg-accent theme-text-smart-contrast'
                  : 'theme-bg-secondary theme-text-primary hover:theme-bg-secondary-hover'
              }`}
            >
              亮色
            </button>
            <button onClick={() => handleThemeSelect('dark')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs transition-all hover:scale-102 active:scale-98 ${
                theme === 'dark'
                  ? 'theme-bg-accent theme-text-smart-contrast'
                  : 'theme-bg-secondary theme-text-primary hover:theme-bg-secondary-hover'
              }`}
            >
              暗色
            </button>
          </div>

          {/* 噪点设置 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs theme-text-primary">噪点</span>
              <span className="text-xs theme-text-secondary">{noiseLevel}%</span>
            </div>
            <input type="range"
              min="0"
              max="100"
              value={noiseLevel}
              onChange={handleNoiseChange}
              className="w-full slider"
              style={{ height: '8px' }}
            />
          </div>

          {/* 角度设置 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs theme-text-primary">角度</span>
              <span className="text-xs theme-text-secondary">{gradientAngle}°</span>
            </div>
            <input type="range"
              min="0"
              max="360"
              value={gradientAngle}
              onChange={handleAngleChange}
              className="w-full slider"
              style={{ height: '8px' }}
            />
          </div>

          {/* 混合模式设置 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs theme-text-primary">混合</span>
              <span className="text-xs theme-text-secondary">{getBlendModeLabel(blendMode)}</span>
            </div>
            <input type="range"
              min="0"
              max="100"
              value={blendMode}
              onChange={handleBlendModeChange}
              className="w-full slider"
              style={{ height: '8px' }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] theme-text-tertiary">黑</span>
              <span className="text-[10px] theme-text-tertiary">原色</span>
              <span className="text-[10px] theme-text-tertiary">白</span>
            </div>
          </div>

          {/* 渐变主题网格 */}
          <div className="grid grid-cols-3 gap-2">
            {gradientThemes.map((themeItem) => (
              <button key={themeItem.id}
                onClick={() => handleGradientSelect(themeItem.id)}
                className={`relative h-14 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 ${
                  gradientTheme === themeItem.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-bg-secondary' : ''
                }`}
                style={{ background: themeItem.gradient }}
                title={themeItem.name}
              >
                {/* 动态噪点效果层 */}
                {noiseLevel > 0 && (
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      opacity: noiseLevel / 100,
                      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                      backgroundSize: '3px 3px'
                    }}
                  />
                )}

                {/* 选中标记 */}
                {gradientTheme === themeItem.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 theme-bg-primary rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                    <Check size={12} className="text-accent" />
                  </div>
                )}

                {/* 主题名称 */}
                <div className="absolute bottom-1 left-1 bg-black/20 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="text-xs theme-text-smart-contrast font-medium">
                    {themeItem.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};



