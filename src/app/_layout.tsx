import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StyleProfileProvider } from '@/context/StyleProfileContext';
import { WardrobeProvider } from '@/context/WardrobeContext';
import { VerifyEmailScreen } from '@/features/auth/components/VerifyEmailScreen';

import LoginScreen from './login';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-900 justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!user.isDevelopmentDemo && !user.emailVerified) {
    return <VerifyEmailScreen />;
  }

  return (
    <WardrobeProvider>
      <StyleProfileProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </StyleProfileProvider>
    </WardrobeProvider>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ErrorBoundary>
        <AuthProvider>
          <RootContent />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
