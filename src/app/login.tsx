import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading, isBackendConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      setErrorMessage('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setErrorMessage(null);

    try {
      await login({
        email: normalizedEmail,
        password,
      });
    } catch (error: unknown) {
      console.error('Login failed', error);
      setErrorMessage(
        isBackendConfigured
          ? 'Die Anmeldung ist fehlgeschlagen. Bitte Zugangsdaten und Verbindung prüfen.'
          : 'Firebase ist für diese Umgebung noch nicht konfiguriert.',
      );
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900 justify-center px-8">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-black dark:text-white mb-2">
          Omni-Fashion
        </Text>
        <Text className="text-zinc-500 text-center">
          Dein digitaler Kleiderschrank & Tauschbörse
        </Text>
      </View>

      <View className="mb-8">
        <TextInput
          placeholder="E-Mail"
          placeholderTextColor="#a1a1aa"
          value={email}
          onChangeText={setEmail}
          className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-black dark:text-white"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />
        <TextInput
          placeholder="Passwort"
          placeholderTextColor="#a1a1aa"
          value={password}
          onChangeText={setPassword}
          className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-black dark:text-white mt-4"
          secureTextEntry
          autoComplete="current-password"
          editable={!isLoading}
        />

        {errorMessage ? (
          <Text className="text-red-500 mt-3">{errorMessage}</Text>
        ) : null}

        {!isBackendConfigured && __DEV__ ? (
          <Text className="text-amber-600 dark:text-amber-400 mt-3 text-sm">
            Entwicklungsmodus: Ohne Firebase-Konfiguration wird ein lokaler
            Demo-Account verwendet. Dieser Pfad ist in Release-Builds gesperrt.
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => void handleLogin()}
        disabled={isLoading}
        className="bg-black dark:bg-white p-4 rounded-xl items-center"
      >
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-white dark:text-black font-bold text-lg">
            Einloggen
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
