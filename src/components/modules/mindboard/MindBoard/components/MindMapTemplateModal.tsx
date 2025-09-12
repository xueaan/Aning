import React, { useState } from 'react';
import { X, Brain, Plus, Sparkles } from 'lucide-react';
import { defaultMindMapTemplates } from '../utils/mindMapGenerator';

interface MindMapTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMindMap: (topic: string, subtopics: string[]) => void;
}

export const MindMapTemplateModal: React.FC<MindMapTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreateMindMap
}) => {
  const [customTopic, setCustomTopic] = useState('');
  const [customSubtopics, setCustomSubtopics] = useState(['', '', '', '']);
  const [activeTab, setActiveTab] = useState<'templates' | 'custom'>('templates');

  if (!isOpen) return null;

  const handleTemplateSelect = (template: typeof defaultMindMapTemplates[0]) => {
    onCreateMindMap(template.topic, template.subtopics);
    onClose();
  };

  const handleCustomCreate = () => {
    if (customTopic.trim()) {
      const filteredSubtopics = customSubtopics.filter(topic => topic.trim());
      onCreateMindMap(customTopic, filteredSubtopics);
      onClose();
      // Reset form
      setCustomTopic('');
      setCustomSubtopics(['', '', '', '']);
    }
  };

  const updateSubtopic = (index: number, value: string) => {
    const newSubtopics = [...customSubtopics];
    newSubtopics[index] = value;
    setCustomSubtopics(newSubtopics);
  };

  const addSubtopic = () => {
    setCustomSubtopics([...customSubtopics, '']);
  };

  const removeSubtopic = (index: number) => {
    const newSubtopics = customSubtopics.filter((_, i) => i !== index);
    setCustomSubtopics(newSubtopics);
  };

  return (
    <div className="feather-glass-modal-backdrop">
      <div className="feather-glass-modal rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold theme-text-primary">创建思维导图</h2>
              <p className="text-sm theme-text-secondary">选择模板或自定义创建</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 hover:theme-bg-accent/20 rounded-lg transition-colors"
          >
          <X className="w-5 h-5 theme-text-secondary" />
        </button>
      </div>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'templates'
            ? 'feather-glass-nav active theme-text-primary'
            : 'feather-glass-nav theme-text-secondary hover:theme-text-primary'
          }`}
          >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          模板
        </div>
      </button>
      <button onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'custom'
          ? 'feather-glass-nav active theme-text-primary'
          : 'feather-glass-nav theme-text-secondary hover:theme-text-primary'
        }`}
          >
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        自定�?            </div>
    </button>
        </div>

        {/* Templates Tab */}
{
  activeTab === 'templates' && (
    <div className="space-y-4">
      <h3 className="text-lg font-medium theme-text-primary mb-4">选择思维导图模板</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultMindMapTemplates.map((template, index) => (
          <div key={index} onClick={() => handleTemplateSelect(template)}
            className="p-4 border border-theme-border-primary rounded-lg hover:theme-bg-accent/10 cursor-pointer transition-all group"
                >
        <h4 className="font-medium theme-text-primary mb-2 group-hover:text-blue-500 transition-colors">
          {template.name}
        </h4>
        <p className="text-sm theme-text-secondary mb-3">
          中心主题: {template.topic}
        </p>
        <div className="flex flex-wrap gap-1">
          {template.subtopics.map((subtopic, subIndex) => (
            <span key={subIndex}
            className="text-xs px-2 py-1 theme-bg-accent/20 theme-text-secondary rounded"
            >
            {subtopic}
                      </span>
                    ))}
      </div>
    </div>
  ))
}
            </div>
          </div>
        )}

        {/* Custom Tab */}
{
  activeTab === 'custom' && (
    <div className="space-y-4">
      <h3 className="text-lg font-medium theme-text-primary mb-4">自定义思维导图</h3>
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">
          中心主题 *
        </label>
        <input type="text"
          value={customTopic} onChange={(e) => setCustomTopic(e.target.value)}
        placeholder="输入中心主题"
        
            className="w-full p-3 border border-theme-border-primary rounded-lg theme-bg-secondary theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
      </div>
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">
          子主题(可选)
        </label>
        <div className="space-y-2">
          {customSubtopics.map((subtopic, index) => (
            <div key={index} 
            className="flex gap-2">
              <input type="text"
                value={subtopic} onChange={(e) => updateSubtopic(index, e.target.value)}
              placeholder={`子主题${index + 1}`}
              className="flex-1 p-2 border border-theme-border-primary rounded-lg theme-bg-secondary theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
              {customSubtopics.length > 1 && (
                <button onClick={() => removeSubtopic(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                <X className="w-4 h-4" />
                      </button>
          )}
        </div>
                ))}
      </div>

      <button onClick={addSubtopic}
            className="mt-2 flex items-center gap-2 text-blue-500 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors"
              >
      <Plus className="w-4 h-4" />
      添加子主题              </button>
            </div>

            {/* Create Button */}
    <div className="flex justify-end pt-4">
      <button onClick={handleCustomCreate} disabled={!customTopic.trim()}
        
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        创建思维导图
      </button>
            </div>
          </div>
        )
}
      </div>
    </div>
  );
};











