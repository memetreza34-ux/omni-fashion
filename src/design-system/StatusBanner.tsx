import { Text, View } from 'react-native';

export function StatusBanner({
  title,
  message,
  tone = 'neutral',
}: {
  title: string;
  message: string;
  tone?: 'neutral' | 'danger' | 'warning' | 'success' | 'brand';
}) {
  const classes = {
    neutral: {
      container:
        'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
      title: 'text-black dark:text-white',
    },
    danger: {
      container: 'bg-red-500/10 border-red-500/30',
      title: 'text-red-700 dark:text-red-300',
    },
    warning: {
      container: 'bg-amber-500/10 border-amber-500/30',
      title: 'text-amber-700 dark:text-amber-300',
    },
    success: {
      container: 'bg-emerald-500/10 border-emerald-500/30',
      title: 'text-emerald-700 dark:text-emerald-300',
    },
    brand: {
      container: 'bg-indigo-500/10 border-indigo-500/25',
      title: 'text-indigo-700 dark:text-indigo-300',
    },
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      className={`border rounded-2xl p-4 ${classes.container}`}
    >
      <Text className={`${classes.title} font-extrabold`}>{title}</Text>
      <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
        {message}
      </Text>
    </View>
  );
}
