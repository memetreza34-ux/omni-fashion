import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useStyleProfile } from '@/context/StyleProfileContext';
import { useUserProfile } from '@/context/UserProfileContext';
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

const FIT_LABELS: Record<FitPreference, string> = {
  slim: 'Schmal',
  regular: 'Regular',
  oversized: 'Oversized',
};

const FORMALITY_OPTIONS = [
  { value: 0.2, label: 'Casual' },
  { value: 0.5, label: 'Ausgeglichen' },
  { value: 0.8, label: 'Formal' },
] as const;

const BOLDNESS_OPTIONS = [
  { value: 0.2, label: 'Minimal' },
  { value: 0.5, label: 'Ausgeglichen' },
  { value: 0.8, label: 'Bold' },
] as const;

function createDefaultQuestionnaire(): StyleQuestionnaire {
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
  maxItems: number,
): T[] {
  if (values.includes(value)) {
    return values.filter((entry) => entry !== value);
  }

  if (values.length >= maxItems) {
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
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minHeight: 48 }}
      className={`px-4 py-3 rounded-full mr-2 mb-2 border items-center justify-center ${
        selected
          ? 'bg-black dark:bg-white border-black dark:border-white'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <Text
        className={
          selected
            ? 'text-white dark:text-black font-bold'
            : 'text-zinc-700 dark:text-zinc-200 font-semibold'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RadioGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: number;
  options: readonly { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="mb-6">
      <Text className="text-zinc-500 uppercase text-xs font-bold mb-3">
        {title}
      </Text>
      <View className="flex-row">
        {options.map((option, index) => {
          const selected = Math.abs(value - option.value) < 0.1;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${title}: ${option.label}`}
              onPress={() => onChange(option.value)}
              style={{ minHeight: 48 }}
              className={`flex-1 rounded-xl border items-center justify-center px-2 ${
                index < options.length - 1 ? 'mr-2' : ''
              } ${
                selected
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Text
                className={
                  selected
                    ? 'text-white text-xs font-bold text-center'
                    : 'text-zinc-600 dark:text-zinc-300 text-xs font-semibold text-center'
                }
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const { logout } = useAuth();
  const {
    profile: styleProfile,
    saveQuestionnaire,
    isSaving: styleSaving,
  } = useStyleProfile();
  const { completeOnboarding, isSaving: profileSaving } = useUserProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [questionnaire, setQuestionnaire] = useState<StyleQuestionnaire>(
    () => styleProfile?.questionnaire ?? createDefaultQuestionnaire(),
  );
  const [error, setError] = useState<string | null>(null);

  const busy = styleSaving || profileSaving;
  const stepOneValid =
    questionnaire.preferredStyles.length > 0 &&
    questionnaire.fitPreferences.length > 0;

  const handleStyle = (style: StylePreference) => {
    setQuestionnaire((current) => ({
      ...current,
      preferredStyles: toggleValue(current.preferredStyles, style, 5),
    }));
  };

  const handleFit = (fit: FitPreference) => {
    setQuestionnaire((current) => ({
      ...current,
      fitPreferences: toggleValue(current.fitPreferences, fit, 3),
    }));
  };

  const handleColor = (color: StyleColorOption) => {
    setQuestionnaire((current) => ({
      ...current,
      preferredColors: toggleValue(current.preferredColors, color, 8),
      avoidedColors: current.avoidedColors.filter((entry) => entry !== color),
    }));
  };

  const finishOnboarding = async () => {
    if (!stepOneValid || busy) {
      return;
    }

    setError(null);

    try {
      await saveQuestionnaire(questionnaire);
      await completeOnboarding();
    } catch (completionError: unknown) {
      console.error('Failed to complete onboarding', completionError);
      setError(
        'Deine Angaben wurden nicht vollständig abgeschlossen. Bitte erneut versuchen; Omni Fashion markiert das Onboarding erst nach erfolgreichem Speichern als fertig.',
      );
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 64,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1 pr-4">
            <Text className="text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-widest">
              Omni Fashion Setup
            </Text>
            <Text className="text-black dark:text-white text-4xl font-black mt-2">
              Deine Style-DNA
            </Text>
            <Text className="text-zinc-500 text-sm mt-2 leading-6">
              Zwei kurze Schritte. Deine Auswahl steuert echte Outfit-Rankings
              aus deinem eigenen Kleiderschrank.
            </Text>
          </View>
          <View className="w-28">
            <AppButton
              label="Abmelden"
              variant="ghost"
              disabled={busy}
              onPress={() => void logout()}
            />
          </View>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 2, now: step }}
          accessibilityLabel={`Onboarding Schritt ${step} von 2`}
          className="mb-7"
        >
          <View className="flex-row">
            <View className="h-2 flex-1 bg-indigo-600 rounded-full mr-2" />
            <View
              className={`h-2 flex-1 rounded-full ${
                step === 2 ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          </View>
          <Text className="text-zinc-500 text-xs mt-2">
            Schritt {step} von 2
          </Text>
        </View>

        {error ? (
          <View className="mb-5">
            <StatusBanner
              tone="danger"
              title="Setup nicht abgeschlossen"
              message={error}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <>
            <Text className="text-black dark:text-white text-2xl font-extrabold">
              Was trägst du gern?
            </Text>
            <Text className="text-zinc-500 text-sm mt-2 mb-4 leading-6">
              Wähle mindestens einen und höchstens fünf Styles.
            </Text>
            <View className="flex-row flex-wrap mb-7">
              {STYLE_PREFERENCES.map((style) => (
                <ChoiceChip
                  key={style}
                  label={STYLE_LABELS[style]}
                  selected={questionnaire.preferredStyles.includes(style)}
                  onPress={() => handleStyle(style)}
                />
              ))}
            </View>

            <Text className="text-black dark:text-white text-xl font-extrabold">
              Bevorzugte Passform
            </Text>
            <Text className="text-zinc-500 text-sm mt-2 mb-4 leading-6">
              Mindestens eine Auswahl. Mehrere Passformen sind möglich.
            </Text>
            <View className="flex-row flex-wrap mb-7">
              {FIT_PREFERENCES.map((fit) => (
                <ChoiceChip
                  key={fit}
                  label={FIT_LABELS[fit]}
                  selected={questionnaire.fitPreferences.includes(fit)}
                  onPress={() => handleFit(fit)}
                />
              ))}
            </View>

            <AppButton
              label="Weiter"
              disabled={!stepOneValid}
              onPress={() => {
                setError(null);
                setStep(2);
              }}
            />
          </>
        ) : (
          <>
            <Text className="text-black dark:text-white text-2xl font-extrabold">
              Feinschliff
            </Text>
            <Text className="text-zinc-500 text-sm mt-2 mb-4 leading-6">
              Lieblingsfarben sind optional. Du kannst alles später im Profil
              ändern.
            </Text>

            <View className="flex-row flex-wrap mb-6">
              {STYLE_COLOR_OPTIONS.map((color) => (
                <ChoiceChip
                  key={color}
                  label={color}
                  selected={questionnaire.preferredColors.includes(color)}
                  onPress={() => handleColor(color)}
                />
              ))}
            </View>

            <RadioGroup
              title="Alltag: Casual bis Formal"
              value={questionnaire.formalVsCasual}
              options={FORMALITY_OPTIONS}
              onChange={(value) =>
                setQuestionnaire((current) => ({
                  ...current,
                  formalVsCasual: value,
                }))
              }
            />

            <RadioGroup
              title="Look: Minimal bis Bold"
              value={questionnaire.minimalVsBold}
              options={BOLDNESS_OPTIONS}
              onChange={(value) =>
                setQuestionnaire((current) => ({
                  ...current,
                  minimalVsBold: value,
                }))
              }
            />

            <AppButton
              label="Omni Fashion starten"
              loading={busy}
              disabled={!stepOneValid}
              onPress={() => void finishOnboarding()}
            />
            <View className="mt-3">
              <AppButton
                label="Zurück"
                variant="ghost"
                disabled={busy}
                onPress={() => {
                  setError(null);
                  setStep(1);
                }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
