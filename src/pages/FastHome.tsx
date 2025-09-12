import React from 'react';

// 🔥 超轻量首屏组件 - 立即显示，无依赖
export const FastHome: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center theme-gradient-bg">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold theme-text-primary">
          Anning
        </h1>
        <p className="text-lg theme-text-secondary">
          正在加载您的个人笔记空间...
        </p>
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};




