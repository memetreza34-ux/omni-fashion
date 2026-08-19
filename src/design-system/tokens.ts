export const designTokens = {
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
  },
  control: {
    minHeight: 48,
    compactMinHeight: 44,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  content: {
    horizontalPadding: 16,
    bottomTabPadding: 120,
  },
  color: {
    brand: '#4f46e5',
    brandPressed: '#4338ca',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    neutralDark: '#18181b',
    neutralLight: '#f4f4f5',
  },
} as const;

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
