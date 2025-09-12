import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypewriterOptions {
  /** 打字速度 (毫秒/字符) */
  speed?: number;
  /** 是否自动开始打字 */
  autoStart?: boolean;
  /** 打字完成回调 */
  onComplete?: () => void;
  /** 是否启用打字效果 */
  enabled?: boolean;
}

interface UseTypewriterReturn {
  /** 当前显示的文本 */
  displayedText: string;
  /** 是否正在打字 */
  isTyping: boolean;
  /** 是否已完成 */
  isComplete: boolean;
  /** 开始打字 */
  startTyping: () => void;
  /** 跳过打字动画，立即显示全部内容 */
  skipTyping: () => void;
  /** 重置状态*/
  reset: () => void;
}

/**
 * 打字机效果Hook
 * 支持逐字符显示文本，可配置速度和跳过功能
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const {
    speed = 30, // 30ms per character
    autoStart = true,
    onComplete,
    enabled = true
  } = options;

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const currentIndexRef = useRef(0);

  // 清理定时器
  const clearTypingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    clearTypingTimeout();
    setDisplayedText('');
    setIsTyping(false);
    setIsComplete(false);
    currentIndexRef.current = 0;
  }, [clearTypingTimeout]);

  // 跳过打字动画
  const skipTyping = useCallback(() => {
    if (!isComplete) {
      clearTypingTimeout();
      setDisplayedText(text);
      setIsTyping(false);
      setIsComplete(true);
      currentIndexRef.current = text.length;
      onComplete?.();
    }
  }, [text, isComplete, clearTypingTimeout, onComplete]);

  // 打字逻辑
  const typeNextCharacter = useCallback(() => {
    const currentIndex = currentIndexRef.current;
    
    if (currentIndex >= text.length) {
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // 获取下一个字符
    const nextChar = text[currentIndex];
    setDisplayedText(text.substring(0, currentIndex + 1));
    currentIndexRef.current = currentIndex + 1;

    // 根据字符类型调整速度
    let nextSpeed = speed;
    if (nextChar === '\n') {
      // 换行符稍慢一些
      nextSpeed = speed * 2;
    } else if (nextChar === ' ') {
      // 空格稍快一些
      nextSpeed = speed * 0.5;
    } else if (/[.!?。！？]/.test(nextChar)) {
      // 句号等标点符号稍慢一些
      nextSpeed = speed * 3;
    } else if (/[,，]/.test(nextChar)) {
      // 逗号稍慢一些
      nextSpeed = speed * 1.5;
    }

    timeoutRef.current = setTimeout(typeNextCharacter, nextSpeed);
  }, [text, speed, onComplete]);

  // 开始打字
  const startTyping = useCallback(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    if (!isTyping && !isComplete) {
      setIsTyping(true);
      typeNextCharacter();
    }
  }, [enabled, text, isTyping, isComplete, typeNextCharacter]);

  // 文本变化时重置
  useEffect(() => {
    reset();
  }, [text, reset]);

  // 自动开始
  useEffect(() => {
    if (enabled && autoStart && text && !isTyping && !isComplete) {
      startTyping();
    }
  }, [enabled, autoStart, text, isTyping, isComplete, startTyping]);

  // 清理副作用
  useEffect(() => {
    return clearTypingTimeout;
  }, [clearTypingTimeout]);

  // 如果禁用打字效果，直接显示全部文本
  if (!enabled) {
    return {
      displayedText: text,
      isTyping: false,
      isComplete: true,
      startTyping: () => {},
      skipTyping: () => {},
      reset: () => {}
    };
  }

  return {
    displayedText,
    isTyping,
    isComplete,
    startTyping,
    skipTyping,
    reset
  };
}