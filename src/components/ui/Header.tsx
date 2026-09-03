import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Badge } from './Badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: 'brand' | 'success' | 'warning' | 'purple' | 'neutral';
    icon?: string;
  };
  rightAction?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Header({
  title,
  subtitle,
  badge,
  rightAction,
  className = '',
  style
}: HeaderProps) {
  return (
    <View className={`flex-row justify-between items-start mb-4 ${className}`} style={style}>
      <View className="flex-1 pr-3">
        <View className="flex-row items-center space-x-2 gap-2 flex-wrap">
          <Text className="text-3xl font-black text-black dark:text-white tracking-tight">
            {title}
          </Text>
          {badge && (
            <Badge
              label={badge.label}
              variant={badge.variant || 'brand'}
              icon={badge.icon}
            />
          )}
        </View>
        {subtitle && (
          <Text className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium leading-relaxed">
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction && (
        <View className="items-end justify-center">
          {rightAction}
        </View>
      )}
    </View>
  );
}
