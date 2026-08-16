import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { normalizeAuthError } from '@/features/auth/services/auth-errors';

type AuthMode = 'login' | 'register' | 'reset';

function titleForMode(mode: AuthMode): string {
  switch (mode) {
    case 'login':
      return 'Willkommen zurück';
    case 'register':
      return 'Dein Kleiderschrank wird smart';
    case 'reset':
      return 'Passwort zurücksetzen';
  }
}

function subtitleForMode(mode: AuthMode): string {
  switch (mode) {
    case 'login':
      return 'Melde dich an, um deinen Schrank, Outfits und OmniSwap zu öffnen.';
    case 'register':
      return 'Erstelle dein Konto. Danach bestätigst du deine E-Mail und startest dein Style-Profil.';
    case 'reset':
      return 'Wir senden dir einen Link, mit dem du ein neues Passwort festlegen kannst.';
  }
}

export default function LoginScreen() {
  const {
    login,
    register,
    requestPasswordReset,
    isLoading,
    isBackendConfigured,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    resetMessages();
    setPassword('');
    setMode(nextMode);
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      setErrorMessage('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    resetMessages();

    try {
      await login({ email: normalizedEmail, password });
    } catch (error: unknown) {
      setErrorMessage(normalizeAuthError(error).message);
    }
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim();
    const normalizedDisplayName = displayName.trim();

    if (!normalizedDisplayName) {
      setErrorMessage('Bitte einen Anzeigenamen eingeben.');
      return;
    }

    if (!normalizedEmail || !password.trim()) {
      setErrorMessage('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    resetMessages();

    try {
      await register({
        displayName: normalizedDisplayName,
        email: normalizedEmail,
        password,
      });
    } catch (error: unknown) {
      setErrorMessage(normalizeAuthError(error).message);
    }
  };

  const handleReset = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setErrorMessage('Bitte deine E-Mail-Adresse eingeben.');
      return;
    }

    resetMessages();

    try {
      await requestPasswordReset(normalizedEmail);
      setSuccessMessage(
        'Wenn die Adresse verwendet werden kann, erhältst du eine E-Mail mit den nächsten Schritten.',
      );
    } catch (error: unknown) {
      setErrorMessage(normalizeAuthError(error).message);
    }
  };

  const handlePrimaryAction = async () => {
    switch (mode) {
      case 'login':
        await handleLogin();
        return;
      case 'register':
        await handleRegister();
        return;
      case 'reset':
        await handleReset();
    }
  };

  const primaryLabel =
    mode === 'login'
      ? 'Einloggen'
      : mode === 'register'
        ? 'Konto erstellen'
        : 'Reset-Link senden';

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 justify-center px-8">
      <View className="mb-8">
        <Text className="text-xs font-bold tracking-[3px] text-indigo-500 uppercase mb-3">
          Omni Fashion
        </Text>
        <Text className="text-4xl font-bold text-black dark:text-white mb-3">
          {titleForMode(mode)}
        </Text>
        <Text className="text-zinc-500 dark:text-zinc-400 text-base leading-6">
          {subtitleForMode(mode)}
        </Text>
      </View>

      <View className="mb-6">
        {mode === 'register' ? (
          <TextInput
            placeholder="Anzeigename"
            placeholderTextColor="#a1a1aa"
            value={displayName}
            onChangeText={setDisplayName}
            className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl text-black dark:text-white mb-3"
            autoCapitalize="words"
            autoComplete="name"
            editable={!isLoading}
          />
        ) : null}

        <TextInput
          placeholder="E-Mail"
          placeholderTextColor="#a1a1aa"
          value={email}
          onChangeText={setEmail}
          className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl text-black dark:text-white"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />

        {mode !== 'reset' ? (
          <TextInput
            placeholder="Passwort"
            placeholderTextColor="#a1a1aa"
            value={password}
            onChangeText={setPassword}
            className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl text-black dark:text-white mt-3"
            secureTextEntry
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            editable={!isLoading}
          />
        ) : null}

        {errorMessage ? (
          <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-3">
            <Text className="text-red-600 dark:text-red-300">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mt-3">
            <Text className="text-emerald-700 dark:text-emerald-300">
              {successMessage}
            </Text>
          </View>
        ) : null}

        {!isBackendConfigured && __DEV__ ? (
          <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mt-3">
            <Text className="text-amber-700 dark:text-amber-300 text-sm">
              Entwicklungsmodus: Login kann den lokalen Demo-Nutzer öffnen.
              Registrierung und Passwort-Reset benötigen das echte Firebase-Dev-Projekt.
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => void handlePrimaryAction()}
        disabled={isLoading}
        className="bg-black dark:bg-white p-4 rounded-2xl items-center"
      >
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-white dark:text-black font-bold text-lg">
            {primaryLabel}
          </Text>
        )}
      </TouchableOpacity>

      {mode === 'login' ? (
        <>
          <TouchableOpacity
            onPress={() => switchMode('reset')}
            disabled={isLoading}
            className="p-4 items-center"
          >
            <Text className="text-zinc-500">Passwort vergessen?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchMode('register')}
            disabled={isLoading}
            className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl items-center"
          >
            <Text className="text-black dark:text-white font-semibold">
              Neues Omni-Fashion-Konto
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          onPress={() => switchMode('login')}
          disabled={isLoading}
          className="p-4 items-center"
        >
          <Text className="text-zinc-500">Zurück zur Anmeldung</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
