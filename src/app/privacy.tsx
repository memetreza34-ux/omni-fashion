import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/design-system/AppButton';
import { AppCard } from '@/design-system/AppCard';
import { StatusBanner } from '@/design-system/StatusBanner';
import {
  deleteMyAccount,
  exportMyData,
  getAccountDeletionReadiness,
} from '@/features/privacy/privacy-service';
import type { AccountDeletionReadiness } from '@/features/privacy/privacy-service';
import { getFirebaseServices } from '@/services/firebase/app';

const BLOCKER_LABELS: Record<string, string> = {
  ACTIVE_SWAP_LISTING: 'Mindestens ein OmniSwap-Listing ist noch aktiv.',
  ACTIVE_SWAP_OFFER: 'Mindestens ein Tauschangebot ist noch offen.',
  OPEN_SWAP_TRANSACTION: 'Mindestens ein Trade ist noch nicht abgeschlossen.',
  ACTIVE_SWAP_LOCK: 'Ein Kleidungsstück ist noch für OmniSwap reserviert.',
};

export function PrivacyScreenContent({ onBack }: { onBack?: () => void }) {
  const { user, isBackendConfigured, logout } = useAuth();
  const [readiness, setReadiness] = useState<AccountDeletionReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reauthenticating, setReauthenticating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  const refreshReadiness = useCallback(async () => {
    if (!isCloudBacked) {
      setReadiness(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setReadiness(await getAccountDeletionReadiness());
    } catch (error: unknown) {
      console.error('Failed to load account deletion readiness', error);
      Alert.alert(
        'Kontostatus nicht geladen',
        'Der Löschstatus konnte nicht sicher geprüft werden. Es wurde nichts verändert.',
      );
    } finally {
      setLoading(false);
    }
  }, [isCloudBacked]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) {
        return refreshReadiness();
      }
      return undefined;
    });

    return () => {
      active = false;
    };
  }, [refreshReadiness]);

  const handleExport = async () => {
    if (exporting || !isCloudBacked) return;
    setExporting(true);
    try {
      const data = await exportMyData();
      await Share.share({
        title: 'Omni Fashion Datenexport',
        message: JSON.stringify(data, null, 2),
      });
    } catch (error: unknown) {
      console.error('Failed to export Omni Fashion data', error);
      Alert.alert(
        'Export fehlgeschlagen',
        'Deine Daten wurden nicht als Export bereitgestellt. Bitte erneut versuchen.',
      );
    } finally {
      setExporting(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!password || reauthenticating) return;
    const { auth } = getFirebaseServices();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) {
      Alert.alert(
        'Erneute Anmeldung nicht möglich',
        'Für dieses Konto ist keine E-Mail-Adresse für die Passwort-Anmeldung verfügbar.',
      );
      return;
    }

    setReauthenticating(true);
    try {
      await reauthenticateWithCredential(
        firebaseUser,
        EmailAuthProvider.credential(firebaseUser.email, password),
      );
      setPassword('');
      await refreshReadiness();
      Alert.alert(
        'Identität bestätigt',
        'Die sensible Kontofunktion ist jetzt für kurze Zeit freigeschaltet.',
      );
    } catch (error: unknown) {
      console.error('Account reauthentication failed', error);
      Alert.alert(
        'Anmeldung fehlgeschlagen',
        'Das Passwort konnte nicht bestätigt werden.',
      );
    } finally {
      setReauthenticating(false);
    }
  };

  const runDeletion = async () => {
    if (
      deleting ||
      !readiness?.ready ||
      !readiness.recentAuthentication ||
      confirmation !== 'LÖSCHEN'
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMyAccount();
      setConfirmation('');
      Alert.alert(
        'Konto gelöscht',
        'Deine privaten Daten und dein Auth-Konto wurden gelöscht. Abgeschlossene Marketplace-Historie wurde pseudonymisiert.',
      );
      try {
        await logout();
      } catch (logoutError: unknown) {
        console.warn('Post-deletion logout cleanup failed', logoutError);
      }
    } catch (error: unknown) {
      console.error('Account deletion failed', error);
      Alert.alert(
        'Konto nicht vollständig gelöscht',
        'Der Backend-Workflow hat keinen erfolgreichen Abschluss bestätigt. Bitte den Status erneut prüfen.',
      );
      await refreshReadiness();
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeletion = () => {
    if (!readiness?.ready) {
      Alert.alert(
        'OmniSwap zuerst abschließen',
        'Offene Marketplace-Vorgänge müssen vor der Kontolöschung beendet werden.',
      );
      return;
    }
    if (!readiness.recentAuthentication) {
      Alert.alert(
        'Identität erneut bestätigen',
        'Gib zuerst dein aktuelles Passwort ein.',
      );
      return;
    }
    if (confirmation !== 'LÖSCHEN') {
      Alert.alert(
        'Bestätigung fehlt',
        'Tippe LÖSCHEN exakt in das Bestätigungsfeld.',
      );
      return;
    }
    Alert.alert(
      'Konto endgültig löschen?',
      'Private Profil-, Wardrobe-, Style-, Notification- und Push-Daten werden gelöscht. Abgeschlossene Marketplace-Historie wird pseudonymisiert.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: () => void runDeletion(),
        },
      ],
    );
  };

  if (!isCloudBacked) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-950 pt-16 px-4">
        {onBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Zurück zum Profil"
            onPress={onBack}
            className="self-start py-2 pr-4 mb-3"
          >
            <Text className="text-zinc-600 dark:text-zinc-300 font-bold">
              ← Profil
            </Text>
          </TouchableOpacity>
        ) : null}
        <Text className="text-black dark:text-white text-3xl font-black mb-5">
          Datenschutz & Konto
        </Text>
        <StatusBanner
          tone="warning"
          title="Echtes Cloud-Konto erforderlich"
          message="Im Development-Demo-Modus werden keine Fake-Exports oder Fake-Kontolöschungen angezeigt."
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-950"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 64,
        paddingBottom: 120,
      }}
    >
      {onBack ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zurück zum Profil"
          onPress={onBack}
          className="self-start py-2 pr-4 mb-3"
        >
          <Text className="text-zinc-600 dark:text-zinc-300 font-bold">
            ← Profil
          </Text>
        </TouchableOpacity>
      ) : null}

      <Text className="text-black dark:text-white text-3xl font-black">
        Datenschutz & Konto
      </Text>
      <Text className="text-zinc-500 text-sm mt-2 mb-6 leading-6">
        Exportiere deine Daten oder verwalte die endgültige Kontolöschung über den Trusted Backend Workflow.
      </Text>

      <AppCard>
        <Text className="text-black dark:text-white text-xl font-extrabold">
          Deine Daten exportieren
        </Text>
        <Text className="text-zinc-500 text-sm mt-2 mb-4 leading-6">
          Sicherheits-Credentials wie Push-Tokens oder Firebase-Zugangsdaten werden nicht exportiert.
        </Text>
        <AppButton
          label="Datenexport öffnen"
          accessibilityLabel="Omni Fashion Datenexport öffnen"
          loading={exporting}
          onPress={() => void handleExport()}
        />
      </AppCard>

      <View className="mt-5">
        <AppCard tone="danger">
          <Text className="text-red-600 dark:text-red-300 text-xl font-extrabold">
            Konto löschen
          </Text>

          {loading ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Kontolöschstatus wird geprüft"
              className="py-6 items-center"
            >
              <ActivityIndicator color="#ef4444" />
            </View>
          ) : (
            <>
              {readiness?.blockers.length ? (
                <View className="mt-4">
                  <Text className="text-black dark:text-white font-bold mb-2">
                    Vorher erforderlich
                  </Text>
                  {readiness.blockers.map((blocker) => (
                    <Text
                      key={blocker}
                      className="text-zinc-600 dark:text-zinc-400 text-xs mb-2 leading-5"
                    >
                      • {BLOCKER_LABELS[blocker] ?? blocker}
                    </Text>
                  ))}
                </View>
              ) : (
                <View className="mt-4">
                  <StatusBanner
                    tone="success"
                    title="OmniSwap bereit"
                    message="Keine offenen OmniSwap-Blocker gefunden."
                  />
                </View>
              )}

              {!readiness?.recentAuthentication ? (
                <View className="mt-5">
                  <Text className="text-black dark:text-white font-bold mb-2">
                    Identität erneut bestätigen
                  </Text>
                  <TextInput
                    accessibilityLabel="Aktuelles Passwort zur Identitätsbestätigung"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Aktuelles Passwort"
                    placeholderTextColor="#71717a"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-black dark:text-white mb-3"
                  />
                  <AppButton
                    label="Passwort bestätigen"
                    variant="secondary"
                    loading={reauthenticating}
                    disabled={!password}
                    onPress={() => void handleReauthenticate()}
                  />
                </View>
              ) : (
                <View className="mt-4">
                  <StatusBanner
                    tone="success"
                    title="Identität bestätigt"
                    message="Die sensible Kontofunktion ist für kurze Zeit freigeschaltet."
                  />
                </View>
              )}

              <Text className="text-zinc-500 text-xs mt-5 leading-5">
                Für die endgültige Löschung tippe LÖSCHEN exakt ein.
              </Text>
              <TextInput
                accessibilityLabel="Bestätigung für endgültige Kontolöschung"
                value={confirmation}
                onChangeText={setConfirmation}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="LÖSCHEN"
                placeholderTextColor="#71717a"
                className="bg-white dark:bg-zinc-950 border border-red-500/30 rounded-xl px-4 py-4 text-black dark:text-white mt-3 mb-3"
              />
              <AppButton
                label="Konto endgültig löschen"
                variant="danger"
                loading={deleting}
                accessibilityLabel="Omni Fashion Konto endgültig löschen"
                onPress={confirmDeletion}
              />
            </>
          )}
        </AppCard>
      </View>
    </ScrollView>
  );
}

export default function PrivacyScreen() {
  return <PrivacyScreenContent />;
}
