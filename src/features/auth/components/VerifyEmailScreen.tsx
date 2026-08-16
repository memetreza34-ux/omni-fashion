import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { normalizeAuthError } from '@/features/auth/services/auth-errors';
import { useAuth } from '@/context/AuthContext';

export function VerifyEmailScreen() {
  const {
    user,
    refreshUser,
    resendVerification,
    logout,
  } = useAuth();
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
        <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4">
          <Text className="text-emerald-700 dark:text-emerald-300">
            {message}
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4">
          <Text className="text-red-600 dark:text-red-300">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => void handleRefresh()}
        disabled={isChecking || isResending}
        className="bg-black dark:bg-white rounded-2xl p-4 items-center mb-3"
      >
        {isChecking ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-white dark:text-black font-bold text-base">
            Ich habe bestätigt
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => void handleResend()}
        disabled={isChecking || isResending}
        className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 items-center mb-3"
      >
        {isResending ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-black dark:text-white font-semibold">
            E-Mail erneut senden
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => void logout()}
        disabled={isChecking || isResending}
        className="p-4 items-center"
      >
        <Text className="text-zinc-500">Mit anderem Konto anmelden</Text>
      </TouchableOpacity>
    </View>
  );
}
