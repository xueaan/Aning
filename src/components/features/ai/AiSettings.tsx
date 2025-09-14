import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores';
import {
  AI_PROVIDERS,
  AiProviderType,
  validateApiKey,
  type AiConfig
} from '@/types/aiConfig';
import { testAiConnection, getAiProviderStatus } from '@/utils/aiUtils';

export const Ais: React.FC = () => {
  const {
    aiConfig,
    setAiConfig,
    setCurrentAiProvider
  } = useAppStore();

  const [selectedProvider, setSelectedProvider] = useState<AiProviderType>(aiConfig.currentProvider);
  const [currentConfig, setCurrentConfig] = useState<AiConfig>(aiConfig[selectedProvider]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);

  // 当选择的提供商变化时更新配置
  useEffect(() => {
    setCurrentConfig(aiConfig[selectedProvider]);
  }, [selectedProvider, aiConfig]);

  // 处理提供商切换
  const handleProviderChange = (provider: AiProviderType) => {
    setSelectedProvider(provider);
    setCurrentAiProvider(provider);
    setTestResult(null);
  };

  // 处理配置项变更
  const handleConfigChange = <K extends keyof AiConfig>(key: K, value: AiConfig[K]) => {
    const newConfig = { ...currentConfig, [key]: value };
    setCurrentConfig(newConfig);
    setAiConfig(selectedProvider, newConfig);
    setTestResult(null);
  };

  // 连接测试
  const handleTestConnection = async () => {
    if (!currentConfig.apiKey || !validateApiKey(selectedProvider, currentConfig.apiKey, currentConfig.baseURL)) {
      setTestResult({
        success: false,
        message: 'API Key 格式不正确'
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await testAiConnection(selectedProvider, currentConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接测试失败，请检查网络连接和配置'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 重置配置
  const handleResetConfig = () => {
    const provider = AI_PROVIDERS[selectedProvider];
    const resetConfig: AiConfig = {
      provider: selectedProvider,
      apiKey: '',
      model: provider.defaultModel,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '',
      enabled: false
    };
    setCurrentConfig(resetConfig);
    setAiConfig(selectedProvider, resetConfig);
    setTestResult(null);
  };

  const currentProvider = AI_PROVIDERS[selectedProvider];

  return (
    <div className="space-y-4">
      {/* 页面头部 - 紧凑设计 */}
      <div className="pb-3 border-b border-primary/10">
        <h3 className="text-lg font-semibold theme-text-primary mb-1">AI模型</h3>
        <p className="theme-text-secondary text-sm">配置服务提供商和参数</p>
      </div>
      <div className="flex gap-2">
        {Object.values(AI_PROVIDERS).map((provider) => (
          <button key={provider.id} onClick={() => handleProviderChange(provider.id)}
        
            className={`flex-1 p-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${selectedProvider === provider.id
            ? 'theme-text-accent feather-glass-deco'
            : 'theme-text-secondary hover:theme-text-primary'
          }`}
          >
        <span className="text-lg">{provider.icon}</span>
        <span className="font-medium">{provider.name}</span>
        {getAiProviderStatus(aiConfig[provider.id]) === 'ready' && (
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        )}
      </button>
        ))}
    </div>
      {/* 配置详情卡片 */}
      <div className="p-4 rounded-xl feather-glass-deco">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm theme-text-secondary mb-2 block">API地址</label>
              <input type="text"
                value={currentConfig.baseURL || currentProvider.baseURL} onChange={(e) => handleConfigChange('baseURL', e.target.value)}
                placeholder={currentProvider.baseURL}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none theme-text-primary feather-glass-deco border border-white/10"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm theme-text-secondary">API Key</label>
                <a href={currentProvider.apiKeyUrl} target="_blank" 
            className="text-sm theme-text-accent hover:underline">获取</a>
              </div>
              <div className="flex gap-2">
                <input type={showApiKey ? 'text' : 'password'} value={currentConfig.apiKey}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)} placeholder="API Key"
                  
            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none theme-text-primary feather-glass-deco border border-white/10"
                />
                <button onClick={() => setShowApiKey(!showApiKey)}
            className="p-2 text-sm rounded-lg theme-text-secondary hover:theme-text-primary feather-glass-deco"
                >
                  {showApiKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {currentConfig.apiKey && !validateApiKey(selectedProvider, currentConfig.apiKey, currentConfig.baseURL) && (
                <p className="text-sm theme-text-error mt-2">⚠️ 格式不正确</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm theme-text-secondary mb-2 block">模型</label>
              <input type="text"
                value={currentConfig.model} onChange={(e) => handleConfigChange('model', e.target.value)}
                placeholder="claude-sonnet"
                
            className="w-full px-3 py-2 text-sm rounded-lg outline-none theme-text-primary feather-glass-deco border border-white/10"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm theme-text-secondary">Temp</label>
                <span className="text-sm theme-text-accent theme-bg-accent/10 px-2 py-1 rounded">{currentConfig.temperature}</span>
              </div>
              <input type="range"
                min="0" max="1" step="0.1"
                value={currentConfig.temperature} onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgba(var(--color-accent), 0.3) 0%, rgba(var(--color-accent), 0.3) ${currentConfig.temperature * 100}%, rgba(var(--border-primary), 0.2) ${currentConfig.temperature * 100}%, rgba(var(--border-primary), 0.2) 100%)`}}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm theme-text-secondary">Tokens</label>
                <span className="text-sm theme-text-success status-success/10 px-2 py-1 rounded">{currentConfig.maxTokens}</span>
              </div>
              <input type="range"
                min="1" max="4096" step="1"
                value={currentConfig.maxTokens} onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgba(var(--color-secondary), 0.3) 0%, rgba(var(--color-secondary), 0.3) ${(currentConfig.maxTokens / 4096) * 100}%, rgba(var(--border-primary), 0.2) ${(currentConfig.maxTokens / 4096) * 100}%, rgba(var(--border-primary), 0.2) 100%)`}}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm theme-text-secondary mb-2 block">系统提示词</label>
            <textarea value={currentConfig.systemPrompt || ''} onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
              placeholder="设置 AI 行为和风格..."
              rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none theme-text-primary feather-glass-deco border border-white/10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={currentConfig.enabled} onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                
            className="w-4 h-4 theme-text-accent bg-transparent border-2 theme-border rounded"
              />
              <span className="text-sm theme-text-primary">启用服务</span>
            </label>
            <div className="flex gap-2">
              <button onClick={handleTestConnection} disabled={!currentConfig.apiKey || isTestingConnection}
                
            className={`px-4 py-2 text-sm rounded-lg theme-text-accent transition-colors ${
                  !currentConfig.apiKey || isTestingConnection ? 'opacity-50 cursor-not-allowed' : 'hover:theme-text-primary feather-glass-deco'
                }`}
              >
                {isTestingConnection ? '测试中' : '测试'}
              </button>
              <button onClick={handleResetConfig}
            className="px-4 py-2 text-sm rounded-lg theme-text-secondary hover:theme-text-primary transition-colors feather-glass-deco"
              >
                重置
              </button>
            </div>
          </div>
      </div>
      {/* 测试结果 */}
      {testResult && (
    <div className="p-4 rounded-xl feather-glass-deco">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${testResult.success ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
          {testResult.success ? (
            <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${testResult.success ? 'text-green-500' : 'text-red-500'
            }`}>
            {testResult.success ? '✓ 连接成功' : '✗ 连接失败'}
          </p>
          <p className={`text-sm mt-1 ${testResult.success ? 'theme-text-secondary' : 'text-red-400'
            }`}>
            {testResult.message}
          </p>
        </div>
      </div>
    </div>
      )}
    </div>
  );
};










