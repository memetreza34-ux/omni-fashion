import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'purple' | 'neutral' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'brand',
  icon,
  className = '',
  style,
  textStyle
}: BadgeProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400';
      case 'purple':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400';
      case 'neutral':
        return 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300';
      case 'outline':
        return 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
      default: // brand
        return 'bg-brand-500/15 border-brand-500/30 text-brand-600 dark:text-brand-400';
    }
  };

  const isSuccess = variant === 'success';
  const isWarning = variant === 'warning';
  const isPurple = variant === 'purple';
  const isNeutral = variant === 'neutral';
  const isOutline = variant === 'outline';

  const getTextColor = () => {
    if (isSuccess) return 'text-emerald-600 dark:text-emerald-400';
    if (isWarning) return 'text-amber-600 dark:text-amber-400';
    if (isPurple) return 'text-purple-600 dark:text-purple-400';
    if (isNeutral) return 'text-zinc-700 dark:text-zinc-300';
    if (isOutline) return 'text-zinc-600 dark:text-zinc-400';
    return 'text-brand-600 dark:text-brand-300';
  };

  const getBorderAndBg = () => {
    if (isSuccess) return 'bg-emerald-500/15 border-emerald-500/30';
    if (isWarning) return 'bg-amber-500/15 border-amber-500/30';
    if (isPurple) return 'bg-purple-500/15 border-purple-500/30';
    if (isNeutral) return 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
    if (isOutline) return 'bg-transparent border-zinc-300 dark:border-zinc-700';
    return 'bg-brand-500/15 border-brand-500/30';
  };

  return (
    <View
      className={`flex-row items-center px-2.5 py-0.5 rounded-full border ${getBorderAndBg()} ${className}`}
      style={style}
    >
      {icon && <Text className="text-[11px] mr-1">{icon}</Text>}
      <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${getTextColor()}`} style={textStyle}>
        {label}
      </Text>
    </View>
  );
}
