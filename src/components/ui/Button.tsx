import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  style,
  textStyle
}: ButtonProps) {
  const getVariantContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';
      case 'outline':
        return 'bg-transparent border border-zinc-300 dark:border-zinc-700';
      case 'ghost':
        return 'bg-transparent';
      case 'glass':
        return 'bg-white/10 dark:bg-zinc-900/60 border border-white/20 dark:border-zinc-700/60 backdrop-blur-md';
      case 'danger':
        return 'bg-rose-600/15 border border-rose-500/30';
      default: // primary
        return 'bg-brand-600 dark:bg-brand-500 shadow-lg shadow-brand-500/30';
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return 'text-zinc-800 dark:text-zinc-100 font-bold';
      case 'outline':
        return 'text-zinc-700 dark:text-zinc-200 font-semibold';
      case 'ghost':
        return 'text-zinc-600 dark:text-zinc-400 font-medium';
      case 'glass':
        return 'text-white font-bold';
      case 'danger':
        return 'text-rose-600 dark:text-rose-400 font-bold';
      default: // primary
        return 'text-white font-extrabold';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'py-1.5 px-3 rounded-xl';
      case 'lg':
        return 'py-4 px-6 rounded-2xl';
      default: // md
        return 'py-2.5 px-4 rounded-xl';
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center ${getVariantContainerStyle()} ${getSizeStyle()} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#ffffff' : '#6366f1'} />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          {typeof children === 'string' ? (
            <Text className={`${getVariantTextStyle()} ${getTextSizeStyle()} ${icon ? 'ml-1.5' : ''}`} style={textStyle}>
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
