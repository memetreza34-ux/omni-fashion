import { ActivityIndicator, Pressable, Text } from 'react-native';

import type { AppButtonVariant } from './tokens';
import { designTokens } from './tokens';

const CONTAINER_CLASSES: Record<AppButtonVariant, string> = {
  primary: 'bg-indigo-600 active:bg-indigo-700',
  secondary:
    'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
  danger: 'bg-red-600 active:bg-red-700',
  ghost: 'bg-transparent',
};

const TEXT_CLASSES: Record<AppButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-black dark:text-white',
  danger: 'text-white',
  ghost: 'text-zinc-600 dark:text-zinc-300',
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const blocked = loading || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      hitSlop={4}
      onPress={onPress}
      style={{ minHeight: designTokens.control.minHeight }}
      className={`rounded-2xl px-4 items-center justify-center ${
        CONTAINER_CLASSES[variant]
      } ${blocked ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'ghost'
              ? '#71717a'
              : '#ffffff'
          }
        />
      ) : (
        <Text className={`${TEXT_CLASSES[variant]} font-extrabold text-sm`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
