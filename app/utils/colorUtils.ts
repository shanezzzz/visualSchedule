/**
 * 将十六进制颜色转换为 RGB 值
 * @param hex 十六进制颜色，如 "#1677ff" 或 "1677ff"
 * @returns RGB 对象 { r, g, b } 或 null（如果格式无效）
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // 移除 # 号
  const cleanHex = hex.replace("#", "");

  // 支持 3 位和 6 位十六进制颜色
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

/**
 * 计算颜色的相对亮度（根据 WCAG 标准）
 * @param r 红色值 (0-255)
 * @param g 绿色值 (0-255)
 * @param b 蓝色值 (0-255)
 * @returns 相对亮度值 (0-1)
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  // 将 RGB 值转换为 0-1 范围
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  // WCAG 公式计算相对亮度
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 根据背景颜色决定文字应该使用黑色还是白色
 * @param backgroundColor 背景颜色（十六进制格式，如 "#1677ff"）
 * @param threshold 亮度阈值，默认 0.5
 * @returns "#000000" (黑色) 或 "#ffffff" (白色)
 */
export function getContrastTextColor(
  backgroundColor: string,
  threshold: number = 0.5
): string {
  const rgb = hexToRgb(backgroundColor);

  if (!rgb) {
    // 如果颜色格式无效，默认返回黑色
    return "#000000";
  }

  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

  // 亮度高于阈值使用黑色文字，否则使用白色文字
  return luminance > threshold ? "#000000" : "#ffffff";
}

/**
 * 计算两种颜色之间的对比度（根据 WCAG 标准）
 * @param color1 第一种颜色（十六进制格式）
 * @param color2 第二种颜色（十六进制格式）
 * @returns 对比度值 (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1;
  }

  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查颜色对比度是否符合 WCAG AA 标准
 * @param foreground 前景色（十六进制格式）
 * @param background 背景色（十六进制格式）
 * @param largeText 是否为大文本（≥18pt 或粗体 ≥14pt）
 * @returns 是否符合标准
 */
export function meetsWCAGStandard(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const requiredRatio = largeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}
