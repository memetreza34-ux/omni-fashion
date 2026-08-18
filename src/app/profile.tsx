import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useStyleProfile } from '@/context/StyleProfileContext';
import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
import { STYLE_LABELS } from '@/features/style-profile/style-profile-engine';
import {
  FIT_PREFERENCES,
  STYLE_COLOR_OPTIONS,
  STYLE_PREFERENCES,
  STYLE_QUESTIONNAIRE_VERSION,
} from '@/features/style-profile/types';
import type {
  FitPreference,
  StyleColorOption,
  StylePreference,
  StyleQuestionnaire,
} from '@/features/style-profile/types';

import { PrivacyScreenContent } from './privacy';

const FIT_LABELS: Record<FitPreference, string> = {
  slim: 'Schmal',
  regular: 'Regular',
  oversized: 'Oversized',
};

const AXIS_OPTIONS = [
  { value: 0.2, left: 'Casual', right: 'Minimal' },
  { value: 0.5, left: 'Ausgeglichen', right: 'Ausgeglichen' },
  { value: 0.8, left: 'Formal', right: 'Bold' },
] as const;

function defaultQuestionnaire(): StyleQuestionnaire {
  return {
    preferredStyles: [],
    preferredColors: [],
    avoidedColors: [],
    fitPreferences: ['regular'],
    formalVsCasual: 0.5,
    minimalVsBold: 0.5,
    questionnaireVersion: STYLE_QUESTIONNAIRE_VERSION,
  };
}

function toggleValue<T extends string>(
  values: T[],
  value: T,
  maxItems?: number,
): T[] {
  if (values.includes(value)) {
    return values.filter((entry) => entry !== value);
  }
  if (maxItems !== undefined && values.length >= maxItems) {
    return values;
  }
  return [...values, value];
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      hitSlop={4}
      onPress={onPress}
      className={`min-h-12 px-4 rounded-full mr-2 mb-2 border items-center justify-center ${
        selected
          ? 'bg-black dark:bg-white border-black dark:border-white'
          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <Text
        className={
          selected
            ? 'text-white dark:text-black font-bold'
            : 'text-zinc-700 dark:text-zinc-200'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AxisSelector({
  title,
  value,
  labels,
  onChange,
}: {
  title: string;
  value: number;
  labels: readonly [string, string, string];
  onChange: (value: number) => void;
}) {
  const values = [0.2, 0.5, 0.8] as const;

  return (
    <View className="mb-6">
      <Text className="text-zinc-500 mb-3 uppercase text-xs font-bold">
        {title}
      </Text>
      <View accessibilityRole="radiogroup" className="flex-row gap-2">
        {values.map((currentValue, index) => {
          const selected = Math.abs(value - currentValue) < 0.1;
          return (
            <Pressable
              key={currentValue}
              accessibilityRole="radio"
              accessibilityLabel={`${title}: ${labels[index]}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(currentValue)}
              className={`flex-1 min-h-12 rounded-xl items-center justify-center border ${
                selected
                  ? 'bg-black dark:bg-white border-black dark:border-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <Text
                className={
                  selected
                    ? 'text-white dark:text-black font-bold text-xs'
                    : 'text-zinc-600 dark:text-zinc-300 text-xs'
                }
              >
                {labels[index]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const {
    profile,
    isLoading,
    isSaving,
    error,
    isCloudBacked,
    wardrobeNeedsRefresh,
    saveQuestionnaire,
    refreshFromWardrobe,
  } = useStyleProfile();
  const [editing, setEditing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<StyleQuestionnaire>(
    defaultQuestionnaire(),
  );

  useEffect(() => {
    if (profile) {
      setQuestionnaire(profile.questionnaire);
    }
  }, [profile]);

  const handlePreferredColor = (color: StyleColorOption) => {
    setQuestionnaire((current) => ({
      ...current,
      preferredColors: toggleValue(current.preferredColors, color, 8),
      avoidedColors: current.avoidedColors.filter((entry) => entry !== color),
    }));
  };

  const handleAvoidedColor = (color: StyleColorOption) => {
    setQuestionnaire((current) => ({
      ...current,
      avoidedColors: toggleValue(current.avoidedColors, color, 8),
      preferredColors: current.preferredColors.filter((entry) => entry !== color),
    }));
  };

  const handleSave = async () => {
    if (questionnaire.preferredStyles.length === 0) {
      Alert.alert(
        'Style fehlt',
        'Wähle mindestens eine Stilrichtung, damit Omni Fashion dein Profil sinnvoll aufbauen kann.',
      );
      return;
    }

    if (questionnaire.fitPreferences.length === 0) {
      Alert.alert(
        'Passform fehlt',
        'Wähle mindestens eine bevorzugte Passform.',
      );
      return;
    }

    try {
      await saveQuestionnaire(questionnaire);
      setEditing(false);
    } catch {
      Alert.alert(
        'Nicht gespeichert',
        'Deine Style-DNA konnte nicht gespeichert werden. Bitte erneut versuchen.',
      );
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshFromWardrobe();
    } catch {
      Alert.alert(
        'Auswertung fehlgeschlagen',
        'Der Kleiderschrank konnte gerade nicht neu ausgewertet werden.',
      );
    }
  };

  if (showPrivacy) {
    return <PrivacyScreenContent onBack={() => setShowPrivacy(false)} />;
  }

  if (isLoading) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Style-DNA wird geladen"
        className="flex-1 bg-white dark:bg-zinc-900 items-center justify-center"
      >
        <ActivityIndicator size="large" />
        <Text className="text-zinc-500 mt-4">Style-DNA wird geladen…</Text>
      </View>
    );
  }

  const showEditor = !profile || editing;

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <View className="pt-16 px-4 mb-6 flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-4xl font-bold text-black dark:text-white">
              Style-DNA
            </Text>
            <Text className="text-zinc-500 mt-2 text-base">
              Deine Präferenzen + dein echter Kleiderschrank
            </Text>
          </View>
          <View>
            <AppButton
              label="Logout"
              accessibilityLabel="Von Omni Fashion abmelden"
              variant="danger"
              onPress={() => void logout()}
            />
          </View>
        </View>

        <View className="px-4 mb-4">
          <StatusBanner
            tone="neutral"
            title={isCloudBacked ? 'Cloud StyleProfile' : 'Entwicklungsprofil lokal'}
            message="Deine Style-DNA entsteht aus deinen Antworten und den erkannten Eigenschaften deiner echten Kleidungsstücke. Ein Foto-Scan wird nicht als fertige KI-Funktion vorgetäuscht."
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Datenschutz und Konto öffnen"
            accessibilityHint="Öffnet Datenexport, Re-Authentifizierung und Kontolöschung"
            onPress={() => setShowPrivacy(true)}
            className="min-h-16 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 mt-3 flex-row justify-between items-center"
          >
            <View className="flex-1 pr-4">
              <Text className="text-black dark:text-white font-extrabold">
                Datenschutz & Konto
              </Text>
              <Text className="text-zinc-500 text-xs mt-1 leading-5">
                Datenexport, Re-Authentifizierung und sichere Kontolöschung.
              </Text>
            </View>
            <Text className="text-zinc-400 text-xl">›</Text>
          </Pressable>
        </View>

        {error ? (
          <View className="px-4 mb-4">
            <StatusBanner
              tone="danger"
              title="Style-DNA nicht aktuell"
              message={error}
            />
          </View>
        ) : null}

        {!showEditor && profile ? (
          <View className="px-4">
            <View className="bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-700 mb-5">
              <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-3">
                Dein Style-Profil
              </Text>
              <Text className="text-3xl font-bold text-black dark:text-white mb-1">
                {profile.summary.title}
              </Text>
              <Text className="text-blue-600 dark:text-blue-400 font-semibold text-lg mb-5">
                {profile.summary.archetype}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-300 leading-6 mb-5">
                {profile.summary.description}
              </Text>

              <Text className="text-zinc-500 uppercase text-xs font-bold mb-2">
                Stärkste Richtungen
              </Text>
              <View className="flex-row flex-wrap mb-4">
                {profile.summary.topStyles.map((style) => (
                  <View
                    key={style}
                    className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-full mr-2 mb-2 border border-zinc-200 dark:border-zinc-700"
                  >
                    <Text className="text-black dark:text-white text-sm font-medium">
                      {STYLE_LABELS[style]}
                    </Text>
                  </View>
                ))}
              </View>

              {profile.questionnaire.preferredColors.length > 0 ? (
                <>
                  <Text className="text-zinc-500 uppercase text-xs font-bold mb-2">
                    Lieblingsfarben
                  </Text>
                  <Text className="text-black dark:text-white mb-5">
                    {profile.questionnaire.preferredColors.join(' · ')}
                  </Text>
                </>
              ) : null}

              <Text className="text-zinc-500 uppercase text-xs font-bold mb-2">
                Passform
              </Text>
              <Text className="text-black dark:text-white">
                {profile.questionnaire.fitPreferences
                  .map((fit) => FIT_LABELS[fit])
                  .join(' · ')}
              </Text>
            </View>

            <View className="bg-zinc-950 dark:bg-black rounded-3xl p-5 mb-5">
              <Text className="text-white font-bold text-lg mb-1">
                Wardrobe Intelligence
              </Text>
              <Text className="text-zinc-400 text-sm mb-4">
                {profile.wardrobeSignals.analyzedItemCount} von{' '}
                {profile.wardrobeSignals.totalItemCount} Teilen wurden bereits
                mit echter Kleidungsanalyse ausgewertet.
              </Text>

              {profile.wardrobeSignals.dominantColors.length > 0 ? (
                <View className="mb-3">
                  <Text className="text-zinc-500 uppercase text-[10px] font-bold mb-1">
                    Häufige Farben
                  </Text>
                  <Text className="text-white text-sm">
                    {profile.wardrobeSignals.dominantColors.join(' · ')}
                  </Text>
                </View>
              ) : null}

              {profile.wardrobeSignals.dominantStyleTags.length > 0 ? (
                <View>
                  <Text className="text-zinc-500 uppercase text-[10px] font-bold mb-1">
                    Erkannte Style-Signale
                  </Text>
                  <Text className="text-white text-sm">
                    {profile.wardrobeSignals.dominantStyleTags.join(' · ')}
                  </Text>
                </View>
              ) : null}

              {wardrobeNeedsRefresh ? (
                <View className="mt-5">
                  <AppButton
                    label="Schrank neu auswerten"
                    accessibilityLabel="Style-DNA aus dem aktuellen Kleiderschrank neu berechnen"
                    variant="secondary"
                    loading={isSaving}
                    onPress={() => void handleRefresh()}
                  />
                </View>
              ) : (
                <Text className="text-emerald-400 text-xs mt-4 font-semibold">
                  Style-DNA ist mit deinem Schrank synchron.
                </Text>
              )}
            </View>

            <View className="mb-4">
              <AppButton
                label="Präferenzen bearbeiten"
                onPress={() => setEditing(true)}
              />
            </View>

            <View className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-4">
              <Text className="font-bold text-black dark:text-white mb-1">
                Foto-Style-Scan & 3D-Avatar
              </Text>
              <Text className="text-zinc-500 text-sm leading-5">
                Diese Funktionen bleiben bewusst nachgelagert. Sie werden erst
                aktiviert, wenn sie echte Daten liefern und den Kernfluss besser
                machen – nicht als Demo-Button.
              </Text>
            </View>
          </View>
        ) : (
          <View className="px-4">
            <View className="mb-7">
              <Text className="text-2xl font-bold text-black dark:text-white mb-2">
                Welche Styles trägst du gern?
              </Text>
              <Text className="text-zinc-500 mb-4">
                Wähle bis zu fünf. Deine Auswahl zählt stärker als automatisch
                erkannte Wardrobe-Tags.
              </Text>
              <View className="flex-row flex-wrap">
                {STYLE_PREFERENCES.map((style) => (
                  <ChoiceChip
                    key={style}
                    label={STYLE_LABELS[style]}
                    selected={questionnaire.preferredStyles.includes(style)}
                    onPress={() =>
                      setQuestionnaire((current) => ({
                        ...current,
                        preferredStyles: toggleValue<StylePreference>(
                          current.preferredStyles,
                          style,
                          5,
                        ),
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View className="mb-7">
              <Text className="text-zinc-500 mb-3 uppercase text-xs font-bold">
                Lieblingsfarben
              </Text>
              <View className="flex-row flex-wrap">
                {STYLE_COLOR_OPTIONS.map((color) => (
                  <ChoiceChip
                    key={color}
                    label={color}
                    selected={questionnaire.preferredColors.includes(color)}
                    onPress={() => handlePreferredColor(color)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-7">
              <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
                Farben, die du vermeiden möchtest
              </Text>
              <Text className="text-zinc-400 text-xs mb-3">
                Optional – dieselbe Farbe kann nicht gleichzeitig bevorzugt und
                vermieden sein.
              </Text>
              <View className="flex-row flex-wrap">
                {STYLE_COLOR_OPTIONS.map((color) => (
                  <ChoiceChip
                    key={color}
                    label={color}
                    selected={questionnaire.avoidedColors.includes(color)}
                    onPress={() => handleAvoidedColor(color)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-7">
              <Text className="text-zinc-500 mb-3 uppercase text-xs font-bold">
                Bevorzugte Passform
              </Text>
              <View className="flex-row flex-wrap">
                {FIT_PREFERENCES.map((fit) => (
                  <ChoiceChip
                    key={fit}
                    label={FIT_LABELS[fit]}
                    selected={questionnaire.fitPreferences.includes(fit)}
                    onPress={() =>
                      setQuestionnaire((current) => ({
                        ...current,
                        fitPreferences: toggleValue<FitPreference>(
                          current.fitPreferences,
                          fit,
                          3,
                        ),
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <AxisSelector
              title="Alltag: Casual bis Formal"
              value={questionnaire.formalVsCasual}
              labels={[
                AXIS_OPTIONS[0].left,
                AXIS_OPTIONS[1].left,
                AXIS_OPTIONS[2].left,
              ]}
              onChange={(value) =>
                setQuestionnaire((current) => ({
                  ...current,
                  formalVsCasual: value,
                }))
              }
            />

            <AxisSelector
              title="Look: Minimal bis Bold"
              value={questionnaire.minimalVsBold}
              labels={[
                AXIS_OPTIONS[0].right,
                AXIS_OPTIONS[1].right,
                AXIS_OPTIONS[2].right,
              ]}
              onChange={(value) =>
                setQuestionnaire((current) => ({
                  ...current,
                  minimalVsBold: value,
                }))
              }
            />

            <View className="mt-2">
              <AppButton
                label="Style-DNA speichern"
                loading={isSaving}
                onPress={() => void handleSave()}
              />
            </View>

            {profile ? (
              <View className="mt-2">
                <AppButton
                  label="Abbrechen"
                  variant="ghost"
                  disabled={isSaving}
                  onPress={() => {
                    setQuestionnaire(profile.questionnaire);
                    setEditing(false);
                  }}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
