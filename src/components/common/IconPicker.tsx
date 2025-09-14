import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import {
  COMMON_ICONS,
  getIconComponent,
  isValidIcon,
  DEFAULT_ICON
} from '@/constants/commonIcons';

export interface IconPickerProps {
  // 必需属性
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;

  // 可选属性
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'modal' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  showSearch?: boolean;
  maxHeight?: string;
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onIconSelect,
  isOpen = true,
  onClose,
  mode = 'inline',
  size = 'md',
  placeholder = '搜索图标...',
  showSearch = true,
  maxHeight = 'max-h-96',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 尺寸配置
  const sizeConfig = {
    sm: {
      iconSize: 16,
      iconContainer: 'w-8 h-8',
      grid: 'grid-cols-6',
      text: 'text-xs'
    },
    md: {
      iconSize: 18,
      iconContainer: 'w-11 h-11',
      grid: 'grid-cols-6',
      text: 'text-sm'
    },
    lg: {
      iconSize: 24,
      iconContainer: 'w-12 h-12',
      grid: 'grid-cols-4',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // 过滤图标
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return COMMON_ICONS;
    }

    const searchLower = searchTerm.toLowerCase();
    return COMMON_ICONS.map(category => ({
      ...category,
      icons: category.icons.filter(iconName =>
        iconName.toLowerCase().includes(searchLower)
      )
    })).filter(category => category.icons.length > 0);
  }, [searchTerm]);

  // 处理图标选择
  const handleIconClick = (iconName: string) => {
    if (isValidIcon(iconName)) {
      onIconSelect(iconName);
      if (mode === 'modal' && onClose) {
        onClose();
      }
    }
  };

  // 渲染图标按钮
  const renderIconButton = (iconName: string) => {
    const IconComponent = getIconComponent(iconName);
    const isSelected = selectedIcon === iconName;

    return (
      <button 
        type="button"
        key={iconName} 
        onClick={() => handleIconClick(iconName)}
        className={`
          ${config.iconContainer} rounded-xl transition-all duration-300 ease-out
          flex items-center justify-center relative group transform-gpu
          ${isSelected
            ? 'theme-bg-accent theme-text-on-accent shadow-xl scale-110 ring-2 ring-accent/30'
            : 'hover:scale-105 hover:shadow-md theme-text-secondary hover:theme-text-primary feather-glass-content hover:feather-glass-panel'
          }
        `}
        title={iconName}
      >
        <IconComponent
          size={config.iconSize}
          strokeWidth={2}
          className={isSelected ? 'theme-text-on-accent' : 'theme-text-secondary group-hover:theme-text-primary'}
        />

        {isSelected && (
          <div className="absolute -top-2 -right-2 theme-bg-success rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-800">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        )}
      </button>
    );
  };

  // 渲染内容
  const content = (
    <div className={`${mode === 'modal' ? 'p-6 rounded-2xl' : ''} ${className}`}>
      {/* 头部 */}
      {mode === 'modal' && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium theme-text-primary">选择图标</h3>
          {onClose && (
            <button 
              type="button"
              onClick={onClose} 
              className="p-1 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary/50 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* 搜索框 */}
      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-secondary w-4 h-4" />
          <input 
            type="text"
            placeholder={placeholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg outline-none theme-text-primary placeholder:theme-text-tertiary transition-all feather-glass-input"
          />
        </div>
      )}

      {/* 图标网格 */}
      <div className={`${maxHeight} overflow-y-auto scrollbar-hidden`}>
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <div className="theme-text-secondary mb-2">未找到匹配的图标</div>
            <div className={`${config.text} theme-text-tertiary`}>请尝试其他搜索词</div>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredCategories.map(category => (
              <div key={category.name}>
                <h4 className={`${config.text} font-medium theme-text-secondary mb-3 px-1`}>
                  {category.label} ({category.icons.length})
                </h4>
                <div className={`grid ${config.grid} gap-3`}>
                  {category.icons.map(renderIconButton)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {mode === 'modal' && (
        <div className="mt-4 pt-3 border-t theme-border">
          <p className="text-xs theme-text-tertiary">
            当前选中：<span className="theme-text-primary font-medium">{selectedIcon || DEFAULT_ICON}</span>
          </p>
        </div>
      )}
    </div>
  );

  // 模态框模式
  if (mode === 'modal') {
    if (!isOpen) return null;

    return (
      <div className="feather-glass-modal modal-glass">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {content}
        </div>
      </div>
    );
  }

  // 内嵌模式
  return content;
};

// 简化的图标按钮组件，用于快速选择
interface IconButtonProps {
  iconName: string;
  isSelected?: boolean;
  onClick?: (iconName: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  isSelected = false,
  onClick,
  size = 'md',
  className = ''
}) => {
  const sizeConfig = {
    sm: { iconSize: 16, container: 'w-8 h-8' },
    md: { iconSize: 20, container: 'w-10 h-10' },
    lg: { iconSize: 24, container: 'w-12 h-12' }
  };

  const config = sizeConfig[size];
  const IconComponent = getIconComponent(iconName);

  return (
    <button 
      type="button"
      onClick={() => onClick?.(iconName)}
      className={`
        ${config.container} rounded-lg transition-all duration-300 ease-out
        flex items-center justify-center transform-gpu
        ${isSelected
          ? 'theme-bg-accent theme-text-on-accent shadow-xl scale-110 ring-2 ring-accent/30'
          : 'hover:scale-105 hover:shadow-md theme-text-secondary hover:theme-text-primary'
        }
        ${className}
      `}
      title={iconName}
    >
      <IconComponent
        size={config.iconSize}
        strokeWidth={2}
      />
    </button>
  );
};