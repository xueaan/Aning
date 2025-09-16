/**
 * 颜色混合工具函数
 * 用于处理渐变的黑白混合效果
 */

/**
 * 将 RGB 颜色与黑色或白色混合
 * @param r - 红色分量 (0-255)
 * @param g - 绿色分量 (0-255)
 * @param b - 蓝色分量 (0-255)
 * @param blendMode - 混合模式 (0-100)
 *   0 = 纯黑
 *   50 = 原色
 *   100 = 纯白
 * @returns 混合后的 RGB 字符串
 */
export function blendColor(r: number, g: number, b: number, blendMode: number): string {
  let blendedR: number, blendedG: number, blendedB: number;

  if (blendMode < 50) {
    // 0-50: 从黑色混合到原色
    const factor = blendMode / 50;
    blendedR = Math.round(r * factor);
    blendedG = Math.round(g * factor);
    blendedB = Math.round(b * factor);
  } else {
    // 50-100: 从原色混合到白色
    const factor = (blendMode - 50) / 50;
    blendedR = Math.round(r + (255 - r) * factor);
    blendedG = Math.round(g + (255 - g) * factor);
    blendedB = Math.round(b + (255 - b) * factor);
  }

  return `${blendedR}, ${blendedG}, ${blendedB}`;
}

/**
 * 处理渐变字符串，应用混合色
 * @param gradient - 原始渐变字符串
 * @param blendMode - 混合模式 (0-100)
 * @param angle - 渐变角度
 * @returns 处理后的渐变字符串
 */
export function processGradient(gradient: string, blendMode: number, angle: number): string {
  // 替换角度
  let processedGradient = gradient.replace(/\d+deg/, `${angle}deg`);

  // 如果是原色模式，直接返回
  if (blendMode === 50) {
    return processedGradient;
  }

  // 处理每个颜色
  processedGradient = processedGradient.replace(
    /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g,
    (_, r, g, b, a) => {
      const blended = blendColor(parseInt(r), parseInt(g), parseInt(b), blendMode);
      return `rgba(${blended}, ${a})`;
    }
  );

  return processedGradient;
}

/**
 * 获取混合模式的描述文字
 * @param blendMode - 混合模式值 (0-100)
 * @returns 描述文字
 */
export function getBlendModeLabel(blendMode: number): string {
  if (blendMode < 20) return '深黑';
  if (blendMode < 40) return '暗色';
  if (blendMode < 60) return '原色';
  if (blendMode < 80) return '亮色';
  return '纯白';
}
