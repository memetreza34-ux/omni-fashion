import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FeatureFlagProvider } from '@/context/FeatureFlagContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SavedOutfitsProvider } from '@/context/SavedOutfitsContext';
import { StyleProfileProvider, useStyleProfile } from '@/context/StyleProfileContext';
import { SwapProvider } from '@/context/SwapContext';
import { TrustSafetyProvider } from '@/context/TrustSafetyContext';
import {
  UserProfileProvider,
  useUserProfile,
} from '@/context/UserProfileContext';
import { WardrobeProvider } from '@/context/WardrobeContext';
import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
import { VerifyEmailScreen } from '@/features/auth/components/VerifyEmailScreen';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';

import LoginScreen from './login';

SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-zinc-900 justify-center items-center">
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

function AuthenticatedExperience() {
  const { logout } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refreshProfile,
  } = useUserProfile();
  const { isLoading: styleProfileLoading } = useStyleProfile();

  if (profileLoading || styleProfileLoading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-950 px-5 justify-center">
        <StatusBanner
          tone="danger"
          title="Profil nicht verfügbar"
          message={
            profileError ??
            'Dein Omni-Fashion-Profil konnte nicht sicher geladen werden.'
          }
        />
        <View className="mt-4">
          <AppButton
            label="Profil erneut laden"
            onPress={() => void refreshProfile()}
          />
        </View>
        <View className="mt-2">
          <AppButton
            label="Abmelden"
            variant="ghost"
            onPress={() => void logout()}
          />
        </View>
      </View>
    );
  }

  if (!profile.onboardingCompleted) {
    return <OnboardingScreen />;
  }

  return (
    <SavedOutfitsProvider>
      <TrustSafetyProvider>
        <NotificationProvider>
          <SwapProvider>
            <AnimatedSplashOverlay />
            <AppTabs />
          </SwapProvider>
        </NotificationProvider>
      </TrustSafetyProvider>
    </SavedOutfitsProvider>
  );
}

function RootContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!user.isDevelopmentDemo && !user.emailVerified) {
    return <VerifyEmailScreen />;
  }

  return (
    <UserProfileProvider>
      <WardrobeProvider>
        <StyleProfileProvider>
          <AuthenticatedExperience />
        </StyleProfileProvider>
      </WardrobeProvider>
    </UserProfileProvider>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ErrorBoundary>
        <AuthProvider>
          <FeatureFlagProvider>
            <RootContent />
          </FeatureFlagProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
