import { useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
import { normalizeAuthError } from '@/features/auth/services/auth-errors';

export function VerifyEmailScreen() {
  const { user, refreshUser, resendVerification, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsChecking(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await refreshUser();
    } catch (error: unknown) {
      setErrorMessage(normalizeAuthError(error).message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await resendVerification();
      setMessage('Die Bestätigungs-E-Mail wurde erneut gesendet.');
    } catch (error: unknown) {
      setErrorMessage(normalizeAuthError(error).message);
    } finally {
      setIsResending(false);
    }
  };

  const blocked = isChecking || isResending;

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 justify-center px-8">
      <View className="mb-10">
        <Text className="text-xs font-bold tracking-[3px] text-indigo-500 uppercase mb-3">
          Omni Fashion
        </Text>
        <Text className="text-4xl font-bold text-black dark:text-white mb-3">
          E-Mail bestätigen
        </Text>
        <Text className="text-zinc-500 dark:text-zinc-400 text-base leading-6">
          Wir haben einen Bestätigungslink an{' '}
          <Text className="font-semibold text-black dark:text-white">
            {user?.email ?? 'deine E-Mail-Adresse'}
          </Text>{' '}
          geschickt. Öffne den Link und prüfe anschließend hier den Status.
        </Text>
      </View>

      {message ? (
        <View className="mb-4">
          <StatusBanner
            tone="success"
            title="E-Mail gesendet"
            message={message}
          />
        </View>
      ) : null}

      {errorMessage ? (
        <View className="mb-4">
          <StatusBanner
            tone="danger"
            title="Aktion nicht möglich"
            message={errorMessage}
          />
        </View>
      ) : null}

      <AppButton
        label="Ich habe bestätigt"
        loading={isChecking}
        disabled={isResending}
        onPress={() => void handleRefresh()}
      />

      <View className="mt-3">
        <AppButton
          label="E-Mail erneut senden"
          variant="secondary"
          loading={isResending}
          disabled={isChecking}
          onPress={() => void handleResend()}
        />
      </View>

      <View className="mt-2">
        <AppButton
          label="Mit anderem Konto anmelden"
          variant="ghost"
          disabled={blocked}
          onPress={() => void logout()}
        />
      </View>
    </View>
  );
}
