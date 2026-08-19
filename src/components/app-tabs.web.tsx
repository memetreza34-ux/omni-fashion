import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Link } from 'expo-router';
import { Pressable, useColorScheme, View, StyleSheet, Text, Platform } from 'react-native';

import { ThemedText } from './themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export interface LucideIconProps {
  size?: number;
  color?: string;
  style?: object;
}

export type LucideIcon = React.FC<LucideIconProps>;

export const Shirt: LucideIcon = ({ size = 16, color = 'currentColor', style }) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style,
      },
      React.createElement('path', {
        d: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
      }),
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>👕</Text>;
};

export const Sparkles: LucideIcon = ({ size = 16, color = 'currentColor', style }) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style,
      },
      React.createElement('path', {
        d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
      }),
      React.createElement('path', {
        d: 'M5 3v4M3 5h4M19 17v4M17 19h4',
      }),
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>✨</Text>;
};

export const ShoppingBag: LucideIcon = ({ size = 16, color = 'currentColor', style }) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style,
      },
      React.createElement('path', {
        d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z',
      }),
      React.createElement('path', {
        d: 'M3 6h18',
      }),
      React.createElement('path', {
        d: 'M16 10a4 4 0 0 1-8 0',
      }),
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>🛍️</Text>;
};

export const Repeat: LucideIcon = ({ size = 16, color = 'currentColor', style }) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style,
      },
      React.createElement('path', {
        d: 'm17 2 4 4-4 4',
      }),
      React.createElement('path', {
        d: 'M3 11v-1a4 4 0 0 1 4-4h14',
      }),
      React.createElement('path', {
        d: 'm7 22-4-4 4-4',
      }),
      React.createElement('path', {
        d: 'M21 13v1a4 4 0 0 1-4 4H3',
      }),
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>🔄</Text>;
};

export const User: LucideIcon = ({ size = 16, color = 'currentColor', style }) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style,
      },
      React.createElement('path', {
        d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
      }),
      React.createElement('circle', {
        cx: 12,
        cy: 7,
        r: 4,
      }),
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>👤</Text>;
};

export interface TabButtonProps extends TabTriggerSlotProps {
  icon?: LucideIcon;
  label?: string;
}

export default function AppTabs(): React.ReactElement {
  return (
    <Tabs style={styles.tabsRoot}>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={Shirt} label="Schrank" />
          </TabTrigger>
          <TabTrigger name="stylist" href="/stylist" asChild>
            <TabButton icon={Sparkles} label="Stylist" />
          </TabTrigger>
          <TabTrigger name="shop" href="/shop" asChild>
            <TabButton icon={ShoppingBag} label="Shop" />
          </TabTrigger>
          <TabTrigger name="swap" href="/swap" asChild>
            <TabButton icon={Repeat} label="OmniSwap" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={User} label="Profil" />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon: Icon,
  label,
  ...props
}: TabButtonProps): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const activeColor = isDark ? '#818CF8' : '#4F46E5';
  const inactiveColor = isDark ? '#A1A1AA' : '#71717A';

  return (
    <Pressable
      {...props}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.tabButton,
        isFocused && (isDark ? styles.tabButtonActiveDark : styles.tabButtonActiveLight),
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tabInner}>
        {Icon && (
          <Icon
            size={16}
            color={isFocused ? activeColor : inactiveColor}
          />
        )}
        <Text
          style={[
            styles.tabText,
            { color: isFocused ? activeColor : inactiveColor },
            isFocused && styles.tabTextActive,
          ]}
        >
          {label || children}
        </Text>
      </View>

      {isFocused && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: activeColor },
          ]}
        />
      )}
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          isDark ? styles.innerContainerDark : styles.innerContainerLight,
        ]}
      >
        <View style={styles.brandGroup}>
          <View style={styles.brandLogoBadge}>
            <Text style={styles.brandLogoIcon}>✨</Text>
          </View>
          <ThemedText type="smallBold" style={styles.brandTitle}>
            Omni-Fashion
          </ThemedText>
        </View>

        <View style={styles.tabsRow}>{props.children}</View>

        <Link href="/swap" asChild>
          <Pressable style={styles.ecoBadgePressable}>
            <View style={styles.ecoBadgeDot} />
            <Text style={isDark ? styles.ecoBadgeTextDark : styles.ecoBadgeTextLight}>
              Circular Hub
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
    height: '100%',
  },
  tabSlot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 50,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    }),
  },
  innerContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  innerContainerDark: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: 'auto',
  },
  brandLogoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoIcon: {
    fontSize: 14,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tabButton: {
    position: 'relative',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    ...Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      },
    }),
  },
  tabButtonActiveLight: {
    backgroundColor: 'rgba(238, 242, 255, 0.9)',
  },
  tabButtonActiveDark: {
    backgroundColor: 'rgba(49, 46, 129, 0.4)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '30%',
    right: '30%',
    height: 2.5,
    borderRadius: 2,
  },
  ecoBadgePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginLeft: Spacing.two,
  },
  ecoBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  ecoBadgeTextLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  ecoBadgeTextDark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
});
