import * as LucideIcons from 'lucide-react';
import { getLucideIconName } from './iconMigrationMap';

// 图标分类配置
export interface IconCategory {
  name: string;
  label: string;
  icons: string[];
}

// 精选实用图标配置 - 迁移到 lucide-react 的120个常用图标
export const COMMON_ICONS: IconCategory[] = [
  {
    name: 'basic',
    label: '基础',
    icons: [
      'Home',
      'User',
      'Users',
      'Settings',
      'Crown',
      'Star',
      'Heart',
      'ThumbsUp',
      'Award',
      'Trophy',
      'CheckCircle',
      'Flame',
      'Zap',
      'Sparkles',
      'Bot',
      'Monitor',
    ],
  },
  {
    name: 'actions',
    label: '操作',
    icons: [
      'Plus',
      'Minus',
      'Edit2',
      'Trash2',
      'Save',
      'Copy',
      'Share2',
      'Send',
      'RefreshCw',
      'RotateCcw',
      'Upload',
      'Download',
      'Move',
      'ArrowDown',
      'Link2',
      'Unlink2',
    ],
  },
  {
    name: 'files',
    label: '文件',
    icons: [
      'Folder',
      'FolderOpen',
      'FileText',
      'File',
      'Book',
      'BookOpen',
      'Library',
      'Database',
      'Image',
      'Camera',
      'Video',
      'Music',
      'HardDrive',
      'Server',
      'Package',
      'Archive',
    ],
  },
  {
    name: 'communication',
    label: '通信',
    icons: [
      'Mail',
      'MailOpen',
      'MessageCircle',
      'MessageSquare',
      'MessageSquare2',
      'Phone',
      'PhoneCall',
      'Smartphone',
      'Bell',
      'BellRing',
      'Inbox',
      'Tag',
      'Wifi',
      'Signal',
      'Link',
      'Radio',
    ],
  },
  {
    name: 'data',
    label: '数据',
    icons: [
      'TrendingUp',
      'PieChart',
      'LineChart',
      'BarChart3',
      'Table2',
      'Database',
      'Monitor',
      'Layout',
      'Target',
      'Focus',
      'Zap',
      'Activity',
      'Calculator',
      'Computer',
      'Tv',
      'Cpu',
    ],
  },
  {
    name: 'business',
    label: '商务',
    icons: [
      'Briefcase',
      'Store',
      'Handshake',
      'Calendar',
      'CalendarDays',
      'Clock',
      'CalendarCheck',
      'Timer',
      'ShoppingCart',
      'DollarSign',
      'CreditCard',
      'PoundSterling',
      'Globe',
      'Earth',
      'MapPin',
      'Navigation',
    ],
  },
  {
    name: 'tools',
    label: '工具',
    icons: [
      'Wrench',
      'Hammer',
      'Settings',
      'Tool',
      'Shield',
      'Key',
      'Lock',
      'Unlock',
      'Search',
      'Filter',
      'ArrowUpDown',
      'Eye',
      'EyeOff',
      'Menu',
      'AlignJustify',
      'MoreHorizontal',
      'Chrome',
      'Grid3X3',
      'Grid2X2',
      'ShieldCheck',
    ],
  },
  {
    name: 'creative',
    label: '创意',
    icons: [
      'Palette',
      'Paintbrush',
      'Sparkles',
      'Image',
      'Lightbulb',
      'Brain',
      'Puzzle',
      'PaintBucket',
      'ColorSwatch',
      'Wand2',
      'RotateCcw',
      'Scissors',
      'Layers2',
      'Star',
      'Layers',
      'Shirt',
    ],
  },
];

// 扁平化的所有图标名称列表
export const ALL_COMMON_ICON_NAMES = COMMON_ICONS.flatMap((category) => category.icons);

// 图标组件映射表 - 使用 lucide-react
export const ICON_COMPONENTS = Object.fromEntries(
  ALL_COMMON_ICON_NAMES.map((iconName) => [iconName, (LucideIcons as any)[iconName]]).filter(
    ([, component]) => component !== undefined
  )
);

// 默认图标
export const DEFAULT_ICON = 'Settings';

// 验证图标是否存在
export const isValidIcon = (iconName: string): boolean => {
  return iconName in ICON_COMPONENTS;
};

// 获取图标组件 - 支持 @icon-park 到 lucide 的自动转换
export const getIconComponent = (iconName: string) => {
  // 首先尝试直接获取 lucide 图标
  if (ICON_COMPONENTS[iconName]) {
    return ICON_COMPONENTS[iconName];
  }

  // 如果是 @icon-park 图标名称，尝试转换为 lucide
  const lucideIconName = getLucideIconName(iconName);
  if (ICON_COMPONENTS[lucideIconName]) {
    return ICON_COMPONENTS[lucideIconName];
  }

  // 兜底返回默认图标
  return ICON_COMPONENTS[DEFAULT_ICON];
};

// 兼容性函数：从 @icon-park 图标名获取 lucide 组件
export const getIconFromLegacyName = (iconParkName: string) => {
  const lucideName = getLucideIconName(iconParkName);
  return getIconComponent(lucideName);
};

// Emoji到图标的映射表（更新为 lucide 图标名称）
export const EMOJI_TO_ICON_MAP: Record<string, string> = {
  '🤖': 'Bot',
  '💻': 'Monitor',
  '✍️': 'Edit2',
  '🎓': 'GraduationCap',
  '🔬': 'Microscope',
  '🎨': 'Palette',
  '💡': 'Lightbulb',
  '🚀': 'Rocket',
  '📚': 'Book',
  '🎯': 'Target',
  '🏃‍♂️': 'PersonStanding',
  '🌟': 'Star',
  '⚡': 'Zap',
  '🧠': 'Brain',
  '🎭': 'Theater',
  '🛠️': 'Wrench',
  '👤': 'User',
  '🏠': 'Home',
  '⚙️': 'Settings',
  '🔍': 'Search',
  '➕': 'Plus',
  '✏️': 'Edit2',
  '🗑️': 'Trash2',
  '💾': 'Save',
  '📁': 'Folder',
  '📄': 'FileText',
  '📧': 'Mail',
  '📱': 'Smartphone',
  '🔔': 'Bell',
  '📊': 'BarChart3',
  '🌈': 'Palette',
  '❤️': 'Heart',
  '⭐': 'Star',
  '📅': 'Calendar',
  '🔗': 'Link2',
};

// 将emoji转换为图标名称
export const convertEmojiToIcon = (emoji: string): string => {
  return EMOJI_TO_ICON_MAP[emoji] || DEFAULT_ICON;
};
