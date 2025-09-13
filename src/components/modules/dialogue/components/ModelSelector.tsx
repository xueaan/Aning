import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { AI_PROVIDERS, UNIFIED_MODELS, getUnifiedModel } from '@/types/aiConfig';
import { useAppStore } from '@/stores';

export const ModelSelector: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { aiConfig, setCurrentAiProvider, updateAiConfig, setSettingsModalOpen } = useAppStore();
  
  const currentProvider = aiConfig.currentProvider;
  const currentConfig = aiConfig[currentProvider];
  const currentModel = getUnifiedModel(currentConfig.model);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const handleModelChange = (providerId: string, modelId: string) => {
    if (providerId !== currentProvider) {
      setCurrentAiProvider(providerId as any);
    }
    
    updateAiConfig(providerId as any, { model: modelId });
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 theme-bg-secondary hover:theme-bg-tertiary rounded-lg transition-colors"
      >
        <div className="text-sm">
          <div className="theme-text-primary font-medium">
            {AI_PROVIDERS[currentProvider]?.name || currentProvider}
          </div>
          <div className="theme-text-tertiary text-xs">
            {currentModel?.name || currentConfig.model}
          </div>
        </div>
        <ChevronDown size={16} className="theme-text-tertiary" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-80 theme-bg-primary theme-border-primary border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* 设置按钮 */}
          <div className="p-2 border-b theme-border-primary">
            <button
              onClick={() => {
                setSettingsModalOpen(true);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:theme-bg-secondary rounded text-sm theme-text-primary"
            >
              <Settings size={16} />
              AI设置
            </button>
          </div>

          {/* 模型列表 */}
          <div className="p-2">
            {Object.entries(AI_PROVIDERS).map(([providerId, provider]) => {
              const providerConfig = aiConfig[providerId as keyof typeof aiConfig];
              if (!providerConfig || typeof providerConfig === 'string' || Array.isArray(providerConfig) || !providerConfig.enabled) {
                return null;
              }

              const availableModels = UNIFIED_MODELS.filter(model => model.provider === providerId);
              
              return (
                <div key={providerId} className="mb-3">
                  <div className="text-xs theme-text-tertiary font-medium px-2 mb-1">
                    {provider.name}
                  </div>
                  
                  {availableModels.map(model => {
                    const isSelected = currentProvider === providerId && currentConfig.model === model.id;
                    
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleModelChange(providerId, model.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          isSelected 
                            ? 'theme-bg-accent text-white' 
                            : 'hover:theme-bg-secondary theme-text-primary'
                        }`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className={`text-xs ${
                          isSelected ? 'text-white/70' : 'theme-text-tertiary'
                        }`}>
                          {model.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};