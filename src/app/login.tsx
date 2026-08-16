import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
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
            accessibilityLabel="Anzeigename"
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
          accessibilityLabel="E-Mail-Adresse"
          placeholder="E-Mail"
          placeholderTextColor="#a1a1aa"
          value={email}
          onChangeText={setEmail}
          className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl text-black dark:text-white"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!isLoading}
        />

        {mode !== 'reset' ? (
          <TextInput
            accessibilityLabel={
              mode === 'register' ? 'Neues Passwort' : 'Passwort'
            }
            placeholder="Passwort"
            placeholderTextColor="#a1a1aa"
            value={password}
            onChangeText={setPassword}
            className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl text-black dark:text-white mt-3"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            editable={!isLoading}
          />
        ) : null}

        {errorMessage ? (
          <View className="mt-3">
            <StatusBanner tone="danger" title="Aktion nicht möglich" message={errorMessage} />
          </View>
        ) : null}

        {successMessage ? (
          <View className="mt-3">
            <StatusBanner tone="success" title="E-Mail angefordert" message={successMessage} />
          </View>
        ) : null}

        {!isBackendConfigured && __DEV__ ? (
          <View className="mt-3">
            <StatusBanner
              tone="warning"
              title="Entwicklungsmodus"
              message="Login kann den lokalen Demo-Nutzer öffnen. Registrierung und Passwort-Reset benötigen das echte Firebase-Dev-Projekt."
            />
          </View>
        ) : null}
      </View>

      <AppButton
        label={primaryLabel}
        loading={isLoading}
        onPress={() => void handlePrimaryAction()}
      />

      {mode === 'login' ? (
        <>
          <View className="mt-3">
            <AppButton
              label="Passwort vergessen?"
              variant="ghost"
              disabled={isLoading}
              onPress={() => switchMode('reset')}
            />
          </View>
          <View className="mt-1">
            <AppButton
              label="Neues Omni-Fashion-Konto"
              variant="secondary"
              disabled={isLoading}
              onPress={() => switchMode('register')}
            />
          </View>
        </>
      ) : (
        <View className="mt-3">
          <AppButton
            label="Zurück zur Anmeldung"
            variant="ghost"
            disabled={isLoading}
            onPress={() => switchMode('login')}
          />
        </View>
      )}
    </View>
  );
}
