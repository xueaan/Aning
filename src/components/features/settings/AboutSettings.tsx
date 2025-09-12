import React, { useState, useEffect } from 'react';
import { Github, Activity } from 'lucide-react';
import { AnningLogo } from '@/components/common/AnningLogo';

export const Abouts: React.FC = () => {
  const [version, setVersion] = useState<string>('0.1.0');

  // 获取版本信息
  useEffect(() => {
    const getAppVersion = async () => {
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        const appVersion = await getVersion();
        setVersion(appVersion);
      } catch (error) {
        console.error('获取版本失败:', error);
      }
    };

    getAppVersion();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {/* Logo 和标题 */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-2xl ultra-glass flex items-center justify-center mx-auto mb-6">
          <AnningLogo />
        </div>

        <h1 className="text-3xl font-bold theme-text text-center mb-2">Anning</h1>
        <p className="text-lg theme-text-secondary text-center">v{version}</p>
      </div>
      <div className="mb-12 max-w-md">
        <p className="theme-text-secondary text-center">
          基于 Tauri React 构建的模块化个人笔记软件
        </p>
      </div>
      <div className="mb-12">
        <a href="https://github.com/yourusername/anning"
          target="_blank"
          rel="noopener noreferrer"
          
            className="flex items-center gap-2 px-4 py-2 crystal-glass rounded-lg theme-text-secondary hover:theme-text transition-colors"
        >
          <Github size={16} />
          <span className="text-sm">GitHub</span>
        </a>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs theme-text-secondary">
          Made with <Activity size={12} 
            className="inline text-red-500" /> by Anning Team
        </p>
        <p className="text-xs theme-text-secondary">
          © 2025 Anning. MIT License
        </p>
      </div>
    </div>
  );
};








