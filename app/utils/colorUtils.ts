/**
 * Converts a hex color to an RGB value
 * @param hex Hex color, e.g. "#1677ff" or "1677ff"
 * @returns RGB object { r, g, b } or null if format is invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # sign
  const cleanHex = hex.replace("#", "");

  // Support 3-digit and 6-digit hex colors
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
 * Parses RGB/RGBA format color string
 * @param rgbString RGB format string, e.g. "rgb(28, 28, 29)" or "rgba(28, 28, 29, 0.5)"
 * @returns RGB object { r, g, b } or null if format is invalid
 */
export function parseRgbString(rgbString: string): { r: number; g: number; b: number } | null {
  // Matches rgb(r, g, b) or rgba(r, g, b, a) formats
  const rgbMatch = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  
  return null;
}

/**
 * Converts color string to RGB value (supports hex and RGB formats)
 * @param color Color string, supports "#1677ff", "rgb(28, 28, 29)", etc.
 * @returns RGB object { r, g, b } or null if format is invalid
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Try parsing as RGB format
  if (color.startsWith("rgb")) {
    return parseRgbString(color);
  }
  
  // Try parsing as hex format
  if (color.startsWith("#") || /^[0-9A-Fa-f]{3,6}$/.test(color)) {
    return hexToRgb(color);
  }
  
  return null;
}

/**
 * Calculates the relative luminance of a color (based on WCAG standard)
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Relative luminance value (0-1)
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  // WCAG formula for relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Decides whether text should be black or white based on background color
 * @param backgroundColor Background color (supports hex, RGB format, e.g. "#1677ff", "rgb(28, 28, 29)")
 * @param threshold Luminance threshold, default 0.5
 * @returns "#000000" (black) or "#ffffff" (white)
 */
export function getContrastTextColor(
  backgroundColor: string,
  threshold: number = 0.5
): string {
  const rgb = parseColor(backgroundColor);

  if (!rgb) {
    // If color format is invalid, default to white (safer choice)
    return "#ffffff";
  }

  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

  // Use black text for higher luminance, otherwise use white text
  return luminance > threshold ? "#000000" : "#ffffff";
}

/**
 * Calculates the contrast ratio between two colors (based on WCAG standard)
 * @param color1 First color (hex format)
 * @param color2 Second color (hex format)
 * @returns Contrast ratio value (1-21)
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
 * Checks if color contrast meets WCAG AA standard
 * @param foreground Foreground color (hex format)
 * @param background Background color (hex format)
 * @param largeText Whether it's large text (≥18pt or bold ≥14pt)
 * @returns Whether it meets the standard
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
