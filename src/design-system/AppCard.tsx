import type { ReactNode } from 'react';
import { View } from 'react-native';

export function AppCard({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'danger' | 'warning' | 'success' | 'brand';
}) {
  const toneClass = {
    default: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
    danger: 'bg-red-500/5 border-red-500/25',
    warning: 'bg-amber-500/10 border-amber-500/30',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    brand: 'bg-indigo-500/10 border-indigo-500/25',
  }[tone];

  return (
    <View className={`border rounded-3xl p-5 ${toneClass}`}>{children}</View>
  );
}
