/**
 * 颜色工具函数集
 * 提供颜色格式转换、亮度计算、对比度检测等功能
 * 符合 WCAG（Web内容无障碍指南）标准
 */

/**
 * 将十六进制颜色转换为 RGB 值
 *
 * @param hex - 十六进制颜色字符串，例如 "#1677ff" 或 "1677ff"
 * @returns RGB 对象 { r, g, b }，如果格式无效则返回 null
 *
 * @example
 * hexToRgb("#1677ff") // 返回 { r: 22, g: 119, b: 255 }
 * hexToRgb("fff") // 返回 { r: 255, g: 255, b: 255 }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // 移除开头的 # 符号
  const cleanHex = hex.replace("#", "");

  // 支持 3 位和 6 位的十六进制颜色
  if (cleanHex.length === 3) {
    // 3 位格式：每个字符需要重复一次，如 "f0a" -> "ff00aa"
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  if (cleanHex.length === 6) {
    // 6 位格式：标准的十六进制颜色
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  // 格式不正确，返回 null
  return null;
}

/**
 * 解析 RGB/RGBA 格式的颜色字符串
 *
 * @param rgbString - RGB 格式字符串，例如 "rgb(28, 28, 29)" 或 "rgba(28, 28, 29, 0.5)"
 * @returns RGB 对象 { r, g, b }，如果格式无效则返回 null
 *
 * @example
 * parseRgbString("rgb(255, 0, 0)") // 返回 { r: 255, g: 0, b: 0 }
 * parseRgbString("rgba(0, 128, 255, 0.5)") // 返回 { r: 0, g: 128, b: 255 }（忽略透明度）
 */
export function parseRgbString(rgbString: string): { r: number; g: number; b: number } | null {
  // 使用正则表达式匹配 rgb(r, g, b) 或 rgba(r, g, b, a) 格式
  // (?:...) 表示非捕获组，用于匹配但不提取透明度值
  const rgbMatch = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);

  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10), // 红色分量
      g: parseInt(rgbMatch[2], 10), // 绿色分量
      b: parseInt(rgbMatch[3], 10), // 蓝色分量
    };
  }

  // 格式不匹配，返回 null
  return null;
}

/**
 * 将颜色字符串转换为 RGB 值（支持十六进制和 RGB 格式）
 * 这是一个通用的颜色解析函数，能自动识别不同格式
 *
 * @param color - 颜色字符串，支持 "#1677ff"、"rgb(28, 28, 29)" 等格式
 * @returns RGB 对象 { r, g, b }，如果格式无效则返回 null
 *
 * @example
 * parseColor("#ff0000") // 返回 { r: 255, g: 0, b: 0 }
 * parseColor("rgb(0, 255, 0)") // 返回 { r: 0, g: 255, b: 0 }
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  // 尝试解析为 RGB 格式
  if (color.startsWith("rgb")) {
    return parseRgbString(color);
  }

  // 尝试解析为十六进制格式
  // 检查是否以 # 开头，或者是纯十六进制字符（3-6位）
  if (color.startsWith("#") || /^[0-9A-Fa-f]{3,6}$/.test(color)) {
    return hexToRgb(color);
  }

  // 无法识别的格式，返回 null
  return null;
}

/**
 * 计算颜色的相对亮度（基于 WCAG 标准）
 * 相对亮度用于确定颜色的"明亮程度"，是计算对比度的基础
 *
 * WCAG 亮度公式考虑了人眼对不同颜色的敏感度：
 * - 绿色权重最高（0.7152）- 人眼对绿色最敏感
 * - 红色次之（0.2126）
 * - 蓝色最低（0.0722）- 人眼对蓝色最不敏感
 *
 * @param r - 红色值（0-255）
 * @param g - 绿色值（0-255）
 * @param b - 蓝色值（0-255）
 * @returns 相对亮度值（0-1），0 表示最暗（黑色），1 表示最亮（白色）
 *
 * @example
 * calculateLuminance(255, 255, 255) // 返回 1（白色）
 * calculateLuminance(0, 0, 0) // 返回 0（黑色）
 * calculateLuminance(255, 0, 0) // 返回约 0.2126（红色的亮度）
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  // 第一步：将 RGB 值归一化到 0-1 范围，并应用 gamma 校正
  const [rs, gs, bs] = [r, g, b].map((val) => {
    // 将 0-255 范围转换为 0-1 范围
    const normalized = val / 255;

    // Gamma 校正：校正显示器的非线性响应
    // 对于较暗的颜色（≤0.03928），使用线性转换
    // 对于较亮的颜色，使用 gamma 2.4 的幂函数
    return normalized <= 0.03928
      ? normalized / 12.92  // 线性部分
      : Math.pow((normalized + 0.055) / 1.055, 2.4);  // 非线性部分
  });

  // 第二步：使用 WCAG 公式计算相对亮度
  // 权重系数基于人眼对不同颜色的敏感度
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 根据背景色自动选择最佳的文字颜色（黑色或白色）
 * 确保文字在背景上有足够的对比度，提高可读性
 *
 * 这个函数对于动态主题、用户自定义颜色等场景非常有用
 *
 * @param backgroundColor - 背景颜色（支持十六进制、RGB 格式），如 "#1677ff"、"rgb(28, 28, 29)"
 * @param threshold - 亮度阈值（0-1），默认 0.5。高于此值使用黑色文字，否则使用白色文字
 * @returns "#000000"（黑色）或 "#ffffff"（白色）
 *
 * @example
 * getContrastTextColor("#ffffff") // 返回 "#000000"（白色背景用黑色文字）
 * getContrastTextColor("#000000") // 返回 "#ffffff"（黑色背景用白色文字）
 * getContrastTextColor("#1677ff") // 返回 "#ffffff"（蓝色背景用白色文字）
 * getContrastTextColor("rgb(255, 200, 100)") // 返回 "#000000"（浅色背景用黑色文字）
 */
export function getContrastTextColor(
  backgroundColor: string,
  threshold: number = 0.5
): string {
  // 解析背景颜色
  const rgb = parseColor(backgroundColor);

  if (!rgb) {
    // 如果颜色格式无效，默认返回白色（更安全的选择，适合深色背景）
    return "#ffffff";
  }

  // 计算背景颜色的亮度
  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

  // 根据亮度选择文字颜色：
  // - 亮度高（明亮背景）-> 使用黑色文字
  // - 亮度低（暗色背景）-> 使用白色文字
  return luminance > threshold ? "#000000" : "#ffffff";
}

/**
 * 计算两个颜色之间的对比度（基于 WCAG 标准）
 * 对比度用于评估文字和背景之间的可读性
 *
 * WCAG 对比度比例范围：
 * - 1:1 = 没有对比度（相同颜色）
 * - 21:1 = 最大对比度（黑色和白色）
 * - 4.5:1 = WCAG AA 标准（普通文字）
 * - 3:1 = WCAG AA 标准（大号文字）
 * - 7:1 = WCAG AAA 标准（普通文字）
 *
 * @param color1 - 第一个颜色（十六进制格式）
 * @param color2 - 第二个颜色（十六进制格式）
 * @returns 对比度比值（1-21）
 *
 * @example
 * calculateContrastRatio("#ffffff", "#000000") // 返回 21（最大对比度）
 * calculateContrastRatio("#ffffff", "#ffffff") // 返回 1（无对比度）
 * calculateContrastRatio("#1677ff", "#ffffff") // 返回约 3.7
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  // 解析两个颜色
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  // 如果任一颜色无效，返回最低对比度
  if (!rgb1 || !rgb2) {
    return 1;
  }

  // 计算两个颜色的亮度
  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

  // 找出较亮和较暗的颜色
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  // WCAG 对比度公式：(L1 + 0.05) / (L2 + 0.05)
  // 其中 L1 是较亮颜色的亮度，L2 是较暗颜色的亮度
  // 加 0.05 是为了避免除以零，并提供更准确的低对比度测量
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查颜色对比度是否符合 WCAG AA 标准
 * 用于验证文字和背景的组合是否满足无障碍访问要求
 *
 * WCAG AA 标准要求：
 * - 普通文字（<18pt 或 <14pt 粗体）：对比度 ≥ 4.5:1
 * - 大号文字（≥18pt 或 ≥14pt 粗体）：对比度 ≥ 3:1
 *
 * @param foreground - 前景色/文字颜色（十六进制格式）
 * @param background - 背景色（十六进制格式）
 * @param largeText - 是否为大号文字（≥18pt 或粗体≥14pt），默认 false
 * @returns 是否符合标准
 *
 * @example
 * meetsWCAGStandard("#000000", "#ffffff") // 返回 true（21:1 对比度，远超 4.5:1）
 * meetsWCAGStandard("#777777", "#ffffff") // 返回 false（约 4.47:1，未达到 4.5:1）
 * meetsWCAGStandard("#777777", "#ffffff", true) // 返回 true（大号文字只需 3:1）
 */
export function meetsWCAGStandard(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  // 计算对比度
  const ratio = calculateContrastRatio(foreground, background);

  // 根据文字大小确定所需的最小对比度
  const requiredRatio = largeText ? 3 : 4.5;

  // 检查是否达到要求
  return ratio >= requiredRatio;
}
