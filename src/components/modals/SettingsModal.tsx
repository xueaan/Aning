import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '@/stores';
import { X, Palette, Cpu, Bot, Info, Settings, Type } from 'lucide-react';
import { Ais as AiSettings } from '../features/ai/AiSettings';
import { AiAgents } from '../features/ai/AiAgentSettings';
import { Abouts } from '../features/settings/AboutSettings';
import { getBlendModeLabel } from '@/utils/colorBlend';

// 设置页面类型
type SettingsPage = 'appearance' | 'ai' | 'agents' | 'about';

// 设置导航项
const settingsNavigation = [
  { id: 'appearance', name: '外观', icon: Palette },
  { id: 'ai', name: 'AI模型', icon: Cpu },
  { id: 'agents', name: 'AI智能体', icon: Bot },
];

// 关于选项单独定义
const aboutItem = { id: 'about', name: '关于', icon: Info };

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState<SettingsPage>('appearance');
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (currentPage) {
      case 'appearance':
        return <AppearanceSettings />;
      case 'ai':
        return <AiSettings />;
      case 'agents':
        return <AiAgents />;
      case 'about':
        return <Abouts />;
      default:
        return (
          <div className="flex items-center justify-center h-full theme-text-secondary">
            <div className="text-center">
              <Settings size={48} className="mx-auto mb-4 theme-text-secondary" />
              <p>{settingsNavigation.find(item => item.id === currentPage)?.name} 设置</p>
              <p className="text-sm mt-2">此功能正在开发中...</p>
            </div>
          </div>
        );
    }
  };

  return ReactDOM.createPortal(
    <div className="feather-glass-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* 设置弹窗 - 使用轻羽毛玻璃，确保内容可读性*/}
      <div ref={modalRef}
            className="feather-glass-modal w-[900px] h-[600px] max-w-[90vw] max-h-[90vh] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 - 紧凑设计 */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-border-primary/10">
          <div className="flex items-center gap-2">
            <Settings size={16} 
            className="theme-text-accent" />
            <h2 className="text-base font-medium theme-text-primary">应用设置</h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary transition-colors feather-glass-nav"
            title="关闭设置"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex h-[calc(100%-48px)]">
          {/* 左侧导航 - 使用面板级毛玻璃 */}
          <div className="w-56 overflow-y-auto">
            <div className="p-3 flex flex-col h-full">
              <div className="flex-1">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button 
                      key={item.id} 
                      onClick={() => setCurrentPage(item.id as SettingsPage)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'feather-glass-deco theme-text-accent' 
                          : 'theme-text-secondary hover:theme-text-primary hover:feather-glass-deco'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="flex-1 text-left">{item.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-3 mt-3 border-t border-border-primary/10">
                <button 
                  onClick={() => setCurrentPage('about')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'about'
                      ? 'feather-glass-deco theme-text-accent' 
                      : 'theme-text-secondary hover:theme-text-primary hover:feather-glass-deco'
                  }`}
                >
                  <Info size={16} />
                  <span className="flex-1 text-left">{aboutItem.name}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-full p-4">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 外观设置页面
const AppearanceSettings: React.FC = () => {
  const {
    theme,
    noiseLevel,
    gradientAngle,
    blendMode,
    fontFamily,
    setTheme,
    setNoiseLevel,
    setGradientAngle,
    setBlendMode,
    setFontFamily
  } = useAppStore();

  const themes = [
    { key: 'auto', name: '通用', icon: '🔄' },
    { key: 'light', name: '亮色', icon: '☀️' },
    { key: 'dark', name: '暗色', icon: '🌙' }
  ];


  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGradientAngle(Number(e.target.value));
  };

  const handleBlendModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlendMode(Number(e.target.value));
  };

  return (
    <div className="space-y-4">
      {/* 页面头部 - 紧凑设计 */}
      <div className="pb-3 border-b border-primary/10">
        <h3 className="text-lg font-semibold theme-text-primary mb-1">外观设置</h3>
        <p className="theme-text-secondary text-sm">个性化您的应用外观和主题</p>
      </div>

      <div className="space-y-4">
        {/* 主题模式选择 - 紧凑timekeeper风格 */}
        <div className="p-4 rounded-xl feather-glass-content">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} 
            className="theme-text-accent" />
            <h4 className="text-base font-medium theme-text-primary">主题模式</h4>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {themes.map((themeOption) => (
              <button 
                key={themeOption.key} 
                onClick={() => setTheme(themeOption.key as any)}
                className={`relative p-3 rounded-lg text-xs transition-colors ${
                  theme === themeOption.key
                    ? 'theme-text-accent feather-glass-content'
                    : 'theme-text-secondary hover:theme-text-primary'
                }`}
              >
                <div className="text-xl mb-2">{themeOption.icon}</div>
                <div className="font-medium">{themeOption.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 视觉效果控制 */}
        <div className="p-4 rounded-xl feather-glass-content">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="theme-text-accent" />
            <h4 className="text-base font-medium theme-text-primary">视觉效果</h4>
          </div>

          <div className="space-y-3">
            {/* 噪点强度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm theme-text-primary">噪点强度</label>
                <span className="text-xs theme-text-accent px-2 py-1 rounded bg-white/10">
                  {noiseLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(Number(e.target.value))}
                className="theme-slider w-full"
              />
            </div>

            {/* 角度设置 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm theme-text-primary">角度</label>
                <span className="text-xs theme-text-accent px-2 py-1 rounded bg-white/10">
                  {gradientAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={handleAngleChange}
                className="theme-slider w-full"
              />
            </div>

            {/* 混合模式设置 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm theme-text-primary">混合</label>
                <span className="text-xs theme-text-accent px-2 py-1 rounded bg-white/10">
                  {getBlendModeLabel(blendMode)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blendMode}
                onChange={handleBlendModeChange}
                className="theme-slider w-full"
              />
            </div>
          </div>
        </div>


        {/* 字体设置 */}
        <div className="p-4 rounded-xl feather-glass-content">
          <div className="flex items-center gap-2 mb-3">
            <Type size={16} className="theme-text-accent" />
            <h4 className="text-base font-medium theme-text-primary">字体设置</h4>
          </div>

          <div>
            {/* 界面字体 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFontFamily('system')}
                className={`p-3 rounded-lg text-sm transition-colors flex flex-col items-center gap-2 ${
                  fontFamily === 'system'
                    ? 'theme-text-accent feather-glass-content'
                    : 'theme-text-secondary hover:theme-text-primary hover:feather-glass-deco'
                }`}
              >
                <span className="font-system">系统默认</span>
                <span className="text-xs theme-text-secondary">System UI</span>
              </button>
              <button
                onClick={() => setFontFamily('lxgw-neo-zhisong')}
                className={`p-3 rounded-lg text-sm transition-colors flex flex-col items-center gap-2 ${
                  fontFamily === 'lxgw-neo-zhisong'
                    ? 'theme-text-accent feather-glass-content'
                    : 'theme-text-secondary hover:theme-text-primary hover:feather-glass-deco'
                }`}
              >
                <span className="font-lxgw-neo-zhisong">霞鹜新致宋</span>
                <span className="text-xs theme-text-secondary">LXGW Neo ZhiSong</span>
              </button>
              <button
                onClick={() => setFontFamily('lxgw-neo-xihei')}
                className={`p-3 rounded-lg text-sm transition-colors flex flex-col items-center gap-2 ${
                  fontFamily === 'lxgw-neo-xihei'
                    ? 'theme-text-accent feather-glass-content'
                    : 'theme-text-secondary hover:theme-text-primary hover:feather-glass-deco'
                }`}
              >
                <span className="font-lxgw-neo-xihei">霞鹜新晰黑</span>
                <span className="text-xs theme-text-secondary">LXGW Neo XiHei</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};







