/**
 * @icon-park/react 到 lucide-react 的图标映射表
 * 用于图标库迁移过程中的图标名称转换
 */

export const ICON_MIGRATION_MAP: Record<string, string> = {
  // 基础操作图标
  Close: 'X',
  Delete: 'Trash2',
  Plus: 'Plus',
  Add: 'Plus',
  Edit: 'Edit2',
  EditOne: 'Edit',
  Copy: 'Copy',
  Check: 'Check',
  CheckOne: 'Check',
  CheckCircle: 'CheckCircle2',
  Save: 'Save',
  Refresh: 'RefreshCw',
  Search: 'Search',
  Filter: 'Filter',
  Share: 'Share2',
  Send: 'Send',
  Upload: 'Upload',
  Download: 'Download',
  Link: 'Link2',
  Unlink: 'Unlink2',

  // 导航图标
  Up: 'ChevronUp',
  Down: 'ChevronDown',
  Left: 'ChevronLeft',
  Right: 'ChevronRight',
  Home: 'Home',
  Config: 'Settings',
  More: 'MoreHorizontal',

  // 文件图标
  Folder: 'Folder',
  FolderOpen: 'FolderOpen',
  FileText: 'FileText',
  DataFile: 'File',
  Book: 'Book',
  BookOpen: 'BookOpen',
  Notebook: 'BookOpen',
  NotebookAndPen: 'BookOpen',
  Memory: 'Database',
  Picture: 'Image',
  Camera: 'Camera',
  Video: 'Video',
  Music: 'Music',
  HardDisk: 'HardDrive',
  Server: 'Server',
  PackageNew: 'Package',
  Zip: 'Archive',

  // 通信图标
  Mail: 'Mail',
  MailOpen: 'MailOpen',
  Message: 'MessageCircle',
  MessageOne: 'MessageSquare',
  TextMessage: 'MessageSquare',
  Comment: 'MessageCircle',
  Phone: 'Phone',
  PhoneCall: 'PhoneCall',
  Iphone: 'Smartphone',
  Alarm: 'Bell',
  Ring: 'Bell',
  Email: 'Mail',
  Tag: 'Tag',
  Wifi: 'Wifi',
  Signal: 'Signal',
  Connect: 'Link',
  Broadcast: 'Radio',

  // 数据分析图标
  ChartStock: 'TrendingUp',
  ChartPie: 'PieChart',
  ChartLine: 'LineChart',
  Data: 'BarChart3',
  Table: 'Table2',
  Analysis: 'Database',
  Monitor: 'Monitor',
  Dashboard: 'Layout',
  Target: 'Target',
  Focus: 'Focus',
  Speed: 'Zap',
  TrendTwo: 'Activity',
  Calculator: 'Calculator',
  Display: 'Monitor',
  Tv: 'Tv',
  Cpu: 'Cpu',

  // 商务图标
  Briefcase: 'Briefcase',
  Store: 'Store',
  Handshake: 'Handshake',
  Calendar: 'Calendar',
  CalendarDot: 'Calendar',
  Time: 'Clock',
  Schedule: 'Calendar',
  Timer: 'Timer',
  ShoppingCart: 'ShoppingCart',
  Finance: 'DollarSign',
  Dollar: 'DollarSign',
  Pound: 'PoundSterling',
  Globe: 'Globe',
  Earth: 'Globe',
  LocalPin: 'MapPin',
  Navigation: 'Navigation',

  // 工具图标
  Tool: 'Wrench',
  Toolkit: 'Wrench',
  Repair: 'Wrench',
  Shield: 'Shield',
  Key: 'Key',
  Lock: 'Lock',
  Unlock: 'Unlock',
  LockingComputer: 'LockKeyhole',
  Sort: 'ArrowUpDown',
  Preview: 'Eye',
  Eyes: 'Eye',
  PreviewClose: 'EyeOff',
  ApplicationMenu: 'Menu',
  Application: 'Grid3X3',
  HamburgerButton: 'Menu',
  BrowserChrome: 'Chrome',
  AllApplication: 'Grid3X3',
  DataLock: 'Shield',

  // 创意图标
  ColorCard: 'Palette',
  Palette: 'Palette',
  FormatBrush: 'Paintbrush',
  Paint: 'Paintbrush2',
  Creative: 'Sparkles',
  DesignPicture: 'Image',
  Bulb: 'Lightbulb',
  Brain: 'Brain',
  Puzzle: 'Puzzle',
  BackgroundColor: 'Palette',
  Effects: 'Sparkles',
  Transform: 'RotateCcw',
  Cut: 'Scissors',
  AdjustmentOne: 'Layers2',
  Beauty: 'Star',
  Texture: 'Layers',
  Clothes: 'Shirt',

  // 用户与社交图标
  User: 'User',
  People: 'Users',
  Group: 'Users',
  Crown: 'Crown',
  Star: 'Star',
  Heart: 'Heart',
  Like: 'ThumbsUp',
  Badge: 'Award',
  Trophy: 'Trophy',
  Success: 'CheckCircle',
  Fire: 'Flame',
  Lightning: 'Zap',
  Magic: 'Sparkles',
  Robot: 'Bot',
  Computer: 'Monitor',
  CopyLink: 'Copy',
  EditTwo: 'Edit2',

  // 主题图标
  SunOne: 'Sun',
  Moon: 'Moon',

  // 特殊图标
  CircleFiveLine: 'Circle',
  InclusiveGateway: 'Workflow',
  WritingFluently: 'PenTool',
  BranchTwo: 'GitBranch',
  HeartRate: 'Activity',
  Github: 'Github',

  // 思维导图相关
  Todo: 'ListTodo',

  // 其他常用图标
  Move: 'Move',
  Export: 'Download',
  Sync: 'RefreshCw',
  Undo: 'Undo2',
  Redo: 'Redo2',
  Warning: 'AlertTriangle',
  Info: 'Info',
  Error: 'AlertCircle',
};

/**
 * 获取 lucide-react 图标名称
 * @param iconParkName @icon-park/react 图标名称
 * @returns lucide-react 对应的图标名称，如果没有映射则返回原名称
 */
export const getLucideIconName = (iconParkName: string): string => {
  return ICON_MIGRATION_MAP[iconParkName] || iconParkName;
};

/**
 * 检查图标是否需要迁移
 * @param iconName 图标名称
 * @returns 是否存在映射关系
 */
export const hasIconMapping = (iconName: string): boolean => {
  return iconName in ICON_MIGRATION_MAP;
};

/**
 * 获取所有支持的 @icon-park 图标名称
 */
export const getSupportedIconParkNames = (): string[] => {
  return Object.keys(ICON_MIGRATION_MAP);
};
