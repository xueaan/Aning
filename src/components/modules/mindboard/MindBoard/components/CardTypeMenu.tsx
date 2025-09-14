import React from 'react';
import { Plus, Image, StickyNote, FileText } from 'lucide-react';

interface CardTypeMenuProps {
  position: { x: number; y: number };
  onSelect: (type: string) => void;
  onClose: () => void;
}

interface CardTypeOption {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const cardTypeOptions: CardTypeOption[] = [
  {
    type: 'textCard',
    label: '添加文本',
    icon: <Plus className="w-4 h-4" />,
    description: '创建文字卡片'
  },
  {
    type: 'noteCard',
    label: '添加笔记',
    icon: <FileText className="w-4 h-4" />,
    description: '创建笔记卡片'
  },
  {
    type: 'imageCard',
    label: '添加图片',
    icon: <Image className="w-4 h-4" />,
    description: '创建图片卡片'
  },
  {
    type: 'stickyNote',
    label: '添加便签',
    icon: <StickyNote className="w-4 h-4" />,
    description: '创建便签卡片'
  }
];

export const CardTypeMenu: React.FC<CardTypeMenuProps> = ({ position, onSelect, onClose }) => {

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.card-type-menu')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="card-type-menu fixed z-50 backdrop-blur-md bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-xl shadow-xl p-2 min-w-40"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="space-y-1">
        {cardTypeOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-lg hover:bg-white/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white"
          >
            <div className="flex-shrink-0 text-blue-400">
              {option.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};