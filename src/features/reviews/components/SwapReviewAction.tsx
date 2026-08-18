import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/design-system/AppButton';
import {
  submitSwapReview,
  subscribeToSwapReview,
} from '@/features/reviews/review-service';
import type { SwapReview } from '@/features/reviews/types';
import type { SwapTransaction } from '@/features/swap/types';

const RATINGS = [1, 2, 3, 4, 5] as const;

export function SwapReviewAction({
  transaction,
  currentUserId,
}: {
  transaction: SwapTransaction;
  currentUserId: string;
}) {
  const [existingReview, setExistingReview] = useState<SwapReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (
      transaction.status !== 'completed' ||
      transaction.finalizationState !== 'completed'
    ) {
      setExistingReview(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    return subscribeToSwapReview(
      transaction.id,
      currentUserId,
      (review) => {
        setExistingReview(review);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to swap review', error);
        setLoading(false);
      },
    );
  }, [currentUserId, transaction.finalizationState, transaction.id, transaction.status]);

  if (
    transaction.status !== 'completed' ||
    transaction.finalizationState !== 'completed'
  ) {
    return null;
  }

  if (loading) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Bewertungsstatus wird geladen"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-4 items-center"
      >
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
    );
  }

  if (existingReview) {
    return (
      <View
        accessibilityLabel={`Bewertung abgegeben, ${existingReview.rating} von 5 Punkten`}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-4"
      >
        <Text className="text-black dark:text-white font-extrabold">
          Bewertung abgegeben
        </Text>
        <Text className="text-indigo-600 dark:text-indigo-300 text-lg font-black mt-2">
          {existingReview.rating}/5
        </Text>
        {existingReview.comment ? (
          <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-2 leading-5">
            {existingReview.comment}
          </Text>
        ) : null}
      </View>
    );
  }

  const submit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await submitSwapReview({
        transactionId: transaction.id,
        rating,
        comment: comment.trim(),
      });
      setExpanded(false);
      Alert.alert(
        'Bewertung gespeichert',
        'Deine Bewertung wurde dem abgeschlossenen Trade zugeordnet.',
      );
    } catch (error: unknown) {
      console.error('Failed to submit swap review', error);
      Alert.alert(
        'Bewertung nicht gespeichert',
        'Die Bewertung wurde nicht als erfolgreich gespeichert. Bitte erneut versuchen.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <View className="mb-4">
        <AppButton
          label="Tauschpartner bewerten"
          accessibilityLabel={`Tauschpartner für Trade ${transaction.id.slice(0, 6)} bewerten`}
          variant="secondary"
          onPress={() => setExpanded(true)}
        />
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-4">
      <Text className="text-black dark:text-white font-extrabold text-base">
        Wie war der Tausch?
      </Text>
      <Text className="text-zinc-500 text-xs mt-1 leading-5">
        Die Bewertung ist dauerhaft diesem abgeschlossenen Trade zugeordnet.
      </Text>

      <View accessibilityRole="radiogroup" className="flex-row mt-4">
        {RATINGS.map((value, index) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={`${value} von 5 Punkten`}
            accessibilityState={{ selected: rating === value, disabled: submitting }}
            onPress={() => setRating(value)}
            disabled={submitting}
            className={`flex-1 min-h-12 rounded-xl items-center justify-center ${
              index < RATINGS.length - 1 ? 'mr-2' : ''
            } ${
              rating === value
                ? 'bg-indigo-600'
                : 'bg-zinc-100 dark:bg-zinc-800'
            } ${submitting ? 'opacity-50' : ''}`}
          >
            <Text
              className={
                rating === value
                  ? 'text-white font-black'
                  : 'text-black dark:text-white font-bold'
              }
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        accessibilityLabel="Optionaler Kommentar zur Bewertung"
        value={comment}
        onChangeText={setComment}
        editable={!submitting}
        maxLength={500}
        multiline
        placeholder="Optional: kurze Erfahrung zum Tausch"
        placeholderTextColor="#71717a"
        className="bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-xl px-4 py-3 mt-4 min-h-24"
        textAlignVertical="top"
      />
      <Text className="text-zinc-400 text-[10px] mt-1 text-right">
        {comment.length}/500
      </Text>

      <View className="flex-row mt-3">
        <View className="flex-1 mr-2">
          <AppButton
            label="Abbrechen"
            variant="secondary"
            disabled={submitting}
            onPress={() => setExpanded(false)}
          />
        </View>
        <View className="flex-1">
          <AppButton
            label="Bewertung senden"
            accessibilityLabel={`${rating} von 5 Punkten als Bewertung senden`}
            loading={submitting}
            onPress={() => void submit()}
          />
        </View>
      </View>
    </View>
  );
}
