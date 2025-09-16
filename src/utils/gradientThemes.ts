export interface GradientTheme {
  id: string;
  name: string;
  gradient: string;
  colors: string[];
}
export const gradientThemes: GradientTheme[] = [
  {
    id: 'pastel',
    name: '粉彩',
    gradient:
      'linear-gradient(135deg, rgba(102, 126, 234, 1) 0%, rgba(240, 147, 251, 1) 50%, rgba(245, 87, 108, 1) 100%)',
    colors: ['#667eea', '#f093fb', '#f5576c'],
  },
  {
    id: 'cool',
    name: '炫酷',
    gradient:
      'linear-gradient(135deg, rgba(79, 172, 254, 1) 0%, rgba(0, 242, 254, 1) 50%, rgba(168, 237, 234, 1) 100%)',
    colors: ['#4facfe', '#00f2fe', '#a8edea'],
  },
  {
    id: 'vivid',
    name: '鲜亮',
    gradient:
      'linear-gradient(135deg, rgba(67, 233, 123, 1) 0%, rgba(56, 249, 215, 1) 50%, rgba(79, 172, 254, 1) 100%)',
    colors: ['#43e97b', '#38f9d7', '#4facfe'],
  },
  {
    id: 'warm',
    name: '收藏',
    gradient:
      'linear-gradient(135deg, rgba(250, 112, 154, 1) 0%, rgba(254, 225, 64, 1) 50%, rgba(255, 169, 48, 1) 100%)',
    colors: ['#fa709a', '#fee140', '#ffa930'],
  },
  {
    id: 'ocean',
    name: '海洋',
    gradient:
      'linear-gradient(135deg, rgba(46, 49, 146, 1) 0%, rgba(27, 255, 255, 1) 50%, rgba(0, 212, 255, 1) 100%)',
    colors: ['#2E3192', '#1BFFFF', '#00D4FF'],
  },
  {
    id: 'sunset',
    name: '日落',
    gradient:
      'linear-gradient(135deg, rgba(255, 81, 47, 1) 0%, rgba(240, 152, 25, 1) 50%, rgba(253, 185, 155, 1) 100%)',
    colors: ['#FF512F', '#F09819', '#FDB99B'],
  },
  {
    id: 'aurora',
    name: '极光',
    gradient:
      'linear-gradient(135deg, rgba(0, 198, 255, 1) 0%, rgba(0, 114, 255, 1) 25%, rgba(255, 0, 255, 1) 75%, rgba(0, 255, 136, 1) 100%)',
    colors: ['#00c6ff', '#0072ff', '#ff00ff', '#00ff88'],
  },
  {
    id: 'forest',
    name: '森林',
    gradient:
      'linear-gradient(135deg, rgba(19, 78, 94, 1) 0%, rgba(113, 178, 128, 1) 50%, rgba(193, 240, 164, 1) 100%)',
    colors: ['#134E5E', '#71B280', '#C1F0A4'],
  },
  {
    id: 'candy',
    name: '糖果',
    gradient:
      'linear-gradient(135deg, rgba(240, 147, 251, 1) 0%, rgba(245, 87, 108, 1) 25%, rgba(255, 182, 193, 1) 50%, rgba(255, 192, 203, 1) 100%)',
    colors: ['#F093FB', '#F5576C', '#FFB6C1', '#FFC0CB'],
  },
  {
    id: 'purple',
    name: '紫梦',
    gradient:
      'linear-gradient(135deg, rgba(131, 96, 195, 1) 0%, rgba(46, 191, 145, 1) 50%, rgba(255, 236, 210, 1) 100%)',
    colors: ['#8360c3', '#2ebf91', '#ffecd2'],
  },
  {
    id: 'fire',
    name: '烈焰',
    gradient:
      'linear-gradient(135deg, rgba(255, 154, 158, 1) 0%, rgba(254, 207, 239, 1) 25%, rgba(254, 207, 239, 1) 75%, rgba(255, 154, 158, 1) 100%)',
    colors: ['#ff9a9e', '#fecfef'],
  },
  {
    id: 'cosmic',
    name: '宇宙',
    gradient:
      'linear-gradient(135deg, rgba(26, 42, 108, 1) 0%, rgba(178, 31, 31, 1) 50%, rgba(253, 187, 45, 1) 100%)',
    colors: ['#1a2a6c', '#b21f1f', '#fdbb2d'],
  },
];
export const getGradientTheme = (id: string): GradientTheme | undefined => {
  return gradientThemes.find((theme) => theme.id === id);
};
