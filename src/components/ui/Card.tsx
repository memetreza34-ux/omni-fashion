import React from 'react';
import { View, ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'elevated' | 'glass' | 'subtle' | 'gradient';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  style
}: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/10';
      case 'glass':
        return 'bg-white/80 dark:bg-zinc-900/80 border border-white/40 dark:border-zinc-800 backdrop-blur-xl shadow-lg';
      case 'subtle':
        return 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80';
      case 'gradient':
        return 'bg-gradient-to-br from-brand-950/50 to-zinc-950 border border-brand-500/20 shadow-2xl';
      default:
        return 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm';
    }
  };

  return (
    <View
      className={`rounded-3xl p-5 ${getVariantStyle()} ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
