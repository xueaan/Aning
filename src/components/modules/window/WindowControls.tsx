import React from 'react';

interface WindowControlsProps {
  isTauriEnv: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  isTauriEnv,
  onMinimize,
  onMaximize,
  onClose,
  isMaximized,
}) => {
  if (!isTauriEnv) return null;
  return (
    <div className="flex items-center gap-1 ml-2">
      <button className="titlebar-button titlebar-button-minimize" onClick={onMinimize} aria-label="最小化">
        <svg width="10" height="1" viewBox="0 0 10 1">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button className="titlebar-button titlebar-button-maximize" onClick={onMaximize} aria-label={isMaximized ? '还原' : '最大化'}>
        <svg width="10" height="10" viewBox="0 0 10 10">
          <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </button>
      <button className="titlebar-button titlebar-button-close" onClick={onClose} aria-label="关闭">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
};

