import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, X, Bot } from 'lucide-react';
import { useAppStore } from '@/stores';
import { AiAgent } from '@/types/aiConfig';
import { IconPicker } from '@/components/common/IconPicker';
import { getIconComponent, convertEmojiToIcon, DEFAULT_ICON } from '@/constants/commonIcons';

export const AiAgents: React.FC = () => {
  const { aiConfig, addAgent, updateAgent, deleteAgent, setCurrentAgent } = useAppStore();
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: DEFAULT_ICON,
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048
  });
  const [showIconPicker, setShowIconPicker] = useState(false);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: DEFAULT_ICON,
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 2048
    });
  };

  // 开始编辑
  const startEdit = (agent: AiAgent) => {
    setShowAddForm(false);
    setEditingAgent(agent.id);
    setIsEditing(true);
    // 处理旧的 emoji 图标，转换为新的图标名称
    const iconName = agent.icon.length === 1 ? convertEmojiToIcon(agent.icon) : agent.icon;
    setFormData({
      name: agent.name,
      description: agent.description,
      icon: iconName,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens
    });
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingAgent) {
      updateAgent(editingAgent, formData);
      setEditingAgent(null);
      setIsEditing(false);
      resetForm();
    }
  };

  // 添加新智能体
  const addNewAgent = () => {
    if (!formData.name.trim()) return;

    addAgent({
      ...formData,
      isBuiltIn: false
    });

    setShowAddForm(false);
    resetForm();
  };

  // 删除智能体
  const handleDelete = (agent: AiAgent) => {
    if (confirm(`确定要删除智能体 "${agent.name}" 吗？`)) {
      deleteAgent(agent.id);
    }
  };

  // 切换当前智能体
  const handleSetCurrent = (agentId: string) => {
    setCurrentAgent(agentId);
  };

  return (
    <div className="space-y-4">
      {/* 页面头部 - 紧凑设计 */}
      <div className="pb-3 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold theme-text-primary mb-1">AI智能体</h3>
            <p className="theme-text-secondary text-sm">创建和管理专属智能体</p>
          </div>
          <button onClick={() => {
            setShowAddForm(true);
            setEditingAgent(null);
            setIsEditing(false);
            resetForm();
          }}
            className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 theme-text-accent feather-glass-deco"
          >
            <Plus size={16} />
            新建
          </button>
        </div>
      </div>
    
      {/* 表单 */}
      {(showAddForm || isEditing) && (
      <div className="p-4 rounded-xl feather-glass-deco">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-medium theme-text-primary">
            {isEditing ? '编辑智能体' : '新建智能体'}
          </h4>
          <button onClick={() => {
            setShowAddForm(false); setEditingAgent(null); setIsEditing(false); resetForm();
          }} 
            className="theme-button-secondary p-2 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm theme-text-secondary mb-2 block">名称</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="智能体名称"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none theme-text-primary feather-glass-deco border border-white/10"
              />
            </div>
            <div>
              <label className="text-sm theme-text-secondary mb-2 block">图标</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="w-12 h-12 rounded-lg theme-bg-secondary/50 hover:theme-bg-secondary theme-border border transition-all flex items-center justify-center"
                  title="选择图标"
                >
                <div className="text-xl">
                  {React.createElement(getIconComponent(formData.icon), {
                    theme: 'outline',
                    size: 24,
                    fill: 'currentColor',
                    strokeWidth: 2,
                    className: 'theme-text-secondary'
                  })}
                </div>
              </button>
              <div className="text-sm theme-text-tertiary">
                点击选择图标
              </div>
            </div>
            <IconPicker selectedIcon={formData.icon} onIconSelect={(iconName) => {
              setFormData({ ...formData, icon: iconName });
              setShowIconPicker(false);
            }}
            isOpen={showIconPicker} onClose={() => setShowIconPicker(false)}
            mode="modal"
            size="md"
                  />
          </div>
        </div>

        <div>
          <label className="text-sm theme-text-secondary mb-2 block">描述</label>
          <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="简要描述功能特长"
          
            className="w-full px-3 py-2 text-sm rounded-lg outline-none theme-text-primary"
                />
        </div>

        <div>
          <label className="text-sm theme-text-secondary mb-2 block">系统提示词</label>
          <textarea value={formData.systemPrompt} onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
            placeholder="定义角色和行为..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none theme-text-primary feather-glass-deco border border-white/10"
                />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm theme-text-secondary">温度</label>
              <span className="text-sm theme-text-accent theme-bg-accent/20 px-2 py-1 rounded">{formData.temperature}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(var(--color-accent), 0.3) 0%, rgba(var(--color-accent), 0.3) ${formData.temperature * 100}%, rgba(var(--border-primary), 0.2) ${formData.temperature * 100}%, rgba(var(--border-primary), 0.2) 100%)`
            }}
            />
          </div>
          <div>
            <label className="text-sm theme-text-secondary mb-2 block">Token</label>
            <input type="number" value={formData.maxTokens} onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 1024 })}
              min="256" max="8192" step="256"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none theme-text-primary feather-glass-deco border border-white/10"
                  />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={isEditing ? saveEdit : addNewAgent} disabled={!formData.name.trim()}
          
            className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 theme-text-accent transition-colors ${!formData.name.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:theme-text-primary feather-glass-deco'
            }`}
                >
          <Save size={16} />
          {isEditing ? '保存' : '创建'}
        </button>
        <button onClick={() => {
          setShowAddForm(false); setEditingAgent(null); setIsEditing(false); resetForm();
        }} 
            className="px-4 py-2 text-sm rounded-lg theme-text-secondary hover:theme-text-primary transition-colors feather-glass-deco"
        >
          取消
        </button>
      </div>
            </div>
          </div>
        )}

{/* 智能体列表 - timekeeper风格 */ }
<div className="space-y-2">
  {(aiConfig.agents || []).map((agent) => (
    <div key={agent.id}
      className={`p-3 rounded-xl transition-all ${aiConfig.currentAgentId === agent.id ? 'theme-text-accent feather-glass-deco' : 'theme-text-secondary hover:theme-text-primary'}`}
    >
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 flex-shrink-0 rounded-lg theme-bg-secondary/30 flex items-center justify-center">
        {React.createElement(getIconComponent(agent.icon.length === 1 ? convertEmojiToIcon(agent.icon) : agent.icon), {
          theme: 'outline',
          size: 20,
          fill: 'currentColor',
          strokeWidth: 2,
          className: 'theme-text-secondary'
        })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium theme-text-primary truncate">{agent.name}</h3>
          {aiConfig.currentAgentId === agent.id && (
            <span className="px-2 py-1 text-xs theme-bg-accent theme-text-on-accent rounded-full">
              使用中
            </span>
          )}
        </div>
        <p className="text-xs theme-text-secondary truncate">{agent.description}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {aiConfig.currentAgentId !== agent.id && (
        <button onClick={() => handleSetCurrent(agent.id)} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-accent rounded transition-colors">
        使用
                    </button>
                  )}
    <button onClick={() => startEdit(agent)} 
            className="p-1.5 rounded theme-text-secondary hover:theme-text-primary" title="编辑">
      <Edit3 size={16} />
    </button>
    <button onClick={() => handleDelete(agent)} 
            className="p-1.5 rounded text-red-400 hover:text-red-300" title="删除">
      <Trash2 size={16} />
    </button>
  </div>
</div>
            </div>
          ))}
        </div>
        
        {/* 空状态 */}
        {(!aiConfig.agents || aiConfig.agents.length === 0) && (
          <div className="p-6 rounded-xl text-center feather-glass-deco">
            <Bot size={32} className="mx-auto theme-text-secondary mb-3" />
            <h3 className="text-base font-medium theme-text-primary mb-2">还没有智能体</h3>
            <p className="text-sm theme-text-secondary mb-4">创建专属AI智能体，定制专业功能</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm rounded-lg theme-text-accent feather-glass-deco"
            >
              立即创建
            </button>
          </div>
        )}
    </div>
  );
};












