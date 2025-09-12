import React, { useState, useEffect } from 'react';
import { usePasswordStore } from '@/stores';
import {
  PasswordGeneratorOptions,
  PasswordStrengthResult,
  PASSWORD_STRENGTH_COLORS
} from '@/types/password';
import { X } from 'lucide-react';
import { RefreshCw, Eye, EyeOff, Copy } from 'lucide-react';

interface PasswordGeneratorProps {
  onPasswordSelect?: (password: string) => void;
  initialOptions?: Partial<PasswordGeneratorOptions>;
  standalone?: boolean; // 是否作为独立组件使用
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  onPasswordSelect,
  initialOptions,
  standalone = false
}) => {
  const {
    generatorOptions,
    generatedPassword,
    setGeneratorOptions,
    generatePassword,
    checkPasswordStrength
  } = usePasswordStore();

  const [showPassword, setShowPassword] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 合并初始选项
  useEffect(() => {
    if (initialOptions) {
      setGeneratorOptions(initialOptions);
    }
  }, [initialOptions, setGeneratorOptions]);

  // 检查密码强度
  useEffect(() => {
    if (generatedPassword) {
      checkPasswordStrength(generatedPassword).then(strength => {
        setPasswordStrength(strength);
      });
    }
  }, [generatedPassword, checkPasswordStrength]);

  // 生成密码
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePassword();
    } catch (error) {
      console.error('Failed to generate password:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制密码
  const handlePlus = async () => {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  // 选择密码
  const handleSelect = () => {
    if (generatedPassword && onPasswordSelect) {
      onPasswordSelect(generatedPassword);
    }
  };

  // 更新选项
  const updateOption = (key: keyof PasswordGeneratorOptions, value: any) => {
    const newOptions = { ...generatorOptions, [key]: value };

    // 确保至少有一个字符类型被选中
    const hasAnyCharType = newOptions.include_lowercase ||
      newOptions.include_uppercase ||
      newOptions.include_numbers ||
      newOptions.include_symbols;

    if (!hasAnyCharType) {
      newOptions.include_lowercase = true; // 默认包含小写字母
    }

    setGeneratorOptions(newOptions);
  };

  // 初次生成密码
  useEffect(() => {
    if (!generatedPassword) {
      handleGenerate();
    }
  }, []);

  // 获取强度颜色
  const getStrengthColor = (strength?: PasswordStrengthResult) => {
    if (!strength) return '#6B7280';
    return PASSWORD_STRENGTH_COLORS[strength.level];
  };

  // 获取强度百分比
  const getStrengthPercentage = (strength?: PasswordStrengthResult) => {
    if (!strength) return 0;
    return strength.score;
  };

  return (
    <div className={`rounded-xl feather-glass-deco ${standalone ? 'shadow-lg' : ''}`}
    >
      {/* 头部 */}
      {standalone && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-medium theme-text-primary flex items-center gap-2">
            <RefreshCw size={16} />
            密码生成器
          </h3>
          <button 
            onClick={() => {}}
            className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary feather-glass-deco"
          >
              <X size={16} />
          </button>
        </div>
      )}
      
      <div className="p-3 space-y-3">
        {/* 生成的密码 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">生成的密码</label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-text-tertiary hover:text-text-primary rounded"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
          {showPassword ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      <button 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className="p-1.5 text-text-tertiary hover:text-accent rounded"
        title="重新生成"
      >
          {isGenerating ? (
            <div className="animate-spin w-3.5 h-3.5 border border-text-tertiary border-t-transparent rounded-full" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>
    </div>
      
      {/* 密码显示区域 */}
      <div className="relative">
        <input type="text"
          value={showPassword ? (generatedPassword || '') : '••••••••••••••••'}
          readOnly
          className="w-full px-4 py-3 pr-12 font-mono text-sm bg-bg-tertiary border border-border-primary rounded-lg text-text-primary"
        />
        <button onClick={handlePlus}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-colors ${copySuccess
            ? 'theme-text-success'
            : 'text-text-tertiary hover:text-text-primary'
          }`}
          title={copySuccess ? '已复制!' : '复制密码'}
        >
          {copySuccess ? (
            <Copy size={14} />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
      
        {/* 密码强度指示器 */}
        {passwordStrength && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="theme-text-secondary">强度:</span>
              <span className="font-medium capitalize"
                style={{ color: getStrengthColor(passwordStrength) }}
              >
                {passwordStrength.level === 'weak' && '弱'}
                {passwordStrength.level === 'fair' && '一般'}
                {passwordStrength.level === 'good' && '良好'}
                {passwordStrength.level === 'strong' && '强'}
              </span>
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${getStrengthPercentage(passwordStrength)}%`,
                  backgroundColor: getStrengthColor(passwordStrength)
                }}
              />
            </div>
          </div>
        )}
      
      {/* 基本选项 */}
      <div className="space-y-3">
        {/* 密码长度 */}
        <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">长度</label>
              <span className="text-sm theme-text-secondary">{generatorOptions.length}</span>
            </div>
            <input type="range"
              min="8"
              max="64"
              value={generatorOptions.length}
              onChange={(e) => updateOption('length', parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>8</span>
              <span>64</span>
            </div>
        </div>
        
        {/* 字符类型选项 */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={generatorOptions.include_uppercase}
              onChange={(e) => updateOption('include_uppercase', e.target.checked)}
              className="rounded border-border-primary text-accent focus:ring-accent"
            />
            <span className="text-sm theme-text-secondary">大写字母 (A-Z)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={generatorOptions.include_lowercase}
              onChange={(e) => updateOption('include_lowercase', e.target.checked)}
              className="rounded border-border-primary text-accent focus:ring-accent"
            />
            <span className="text-sm theme-text-secondary">小写字母 (a-z)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={generatorOptions.include_numbers}
              onChange={(e) => updateOption('include_numbers', e.target.checked)}
              className="rounded border-border-primary text-accent focus:ring-accent"
            />
            <span className="text-sm theme-text-secondary">数字 (0-9)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={generatorOptions.include_symbols}
              onChange={(e) => updateOption('include_symbols', e.target.checked)}
              className="rounded border-border-primary text-accent focus:ring-accent"
            />
            <span className="text-sm theme-text-secondary">符号 (!@#$...)</span>
          </label>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button onClick={handleGenerate} disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-primary border border-border-primary rounded-lg theme-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw size={16} />
          重新生成
        </button>

        {onPasswordSelect && generatedPassword && (
          <button
            onClick={handleSelect}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 theme-bg-accent theme-text-on-accent rounded-lg hover:theme-bg-accent-hover transition-colors"
          >
            <Copy size={14} />
            使用此密码
          </button>
        )}
      </div>
      </div>
    </div>
  );
};










