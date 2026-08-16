import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isFeatureEnabled } from '@/config/feature-flags';
import { AppButton } from '@/design-system/AppButton';
import { AppCard } from '@/design-system/AppCard';
import { StatusBanner } from '@/design-system/StatusBanner';
import {
  loadModerationQueue,
  resolveModerationReport,
  resolveSwapDispute,
} from '@/features/moderation/moderation-service';
import type {
  ModerationDisputeQueueItem,
  ModerationQueue,
  ModerationReportQueueItem,
} from '@/features/moderation/types';

function dateLabel(millis: number): string {
  return new Date(millis).toLocaleString('de-DE');
}

function ReportCard({
  report,
  busy,
  onResolved,
}: {
  report: ModerationReportQueueItem;
  busy: boolean;
  onResolved: () => Promise<void>;
}) {
  const [note, setNote] = useState('');

  const resolve = async (resolution: 'dismissed' | 'action_required') => {
    await resolveModerationReport({
      reportId: report.id,
      resolution,
      note: note.trim(),
    });
    await onResolved();
  };

  return (
    <AppCard>
      <Text className="text-black dark:text-white font-extrabold text-lg">
        Report · {report.targetType ?? 'Unbekannt'}
      </Text>
      <Text className="text-zinc-500 text-xs mt-1">
        {dateLabel(report.createdAtMillis)} · {report.id}
      </Text>
      <Text className="text-zinc-700 dark:text-zinc-300 text-sm mt-4">
        Grund: {report.reason ?? 'Nicht angegeben'}
      </Text>
      {report.details ? (
        <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
          {report.details}
        </Text>
      ) : null}
      <Text className="text-zinc-500 text-xs mt-3">
        Reporter: {report.reporterId ?? 'unbekannt'}
      </Text>
      <Text className="text-zinc-500 text-xs">
        Ziel: {report.targetId ?? 'unbekannt'}
      </Text>

      <TextInput
        accessibilityLabel="Interne Moderationsnotiz für Report"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={1500}
        placeholder="Interne Moderationsnotiz"
        placeholderTextColor="#71717a"
        className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white mt-4 min-h-20"
      />

      <View className="mt-3">
        <AppButton
          label="Report schließen"
          variant="secondary"
          disabled={busy}
          onPress={() => void resolve('dismissed')}
        />
      </View>
      <View className="mt-2">
        <AppButton
          label="Weitere Maßnahme erforderlich"
          variant="danger"
          disabled={busy}
          onPress={() => void resolve('action_required')}
        />
      </View>
    </AppCard>
  );
}

function DisputeCard({
  dispute,
  busy,
  onResolved,
}: {
  dispute: ModerationDisputeQueueItem;
  busy: boolean;
  onResolved: () => Promise<void>;
}) {
  const [note, setNote] = useState('');

  const resolve = async (resolution: 'resume_trade' | 'manual_recovery') => {
    await resolveSwapDispute({
      transactionId: dispute.transactionId,
      resolution,
      note: note.trim(),
    });
    await onResolved();
  };

  return (
    <AppCard tone="warning">
      <Text className="text-black dark:text-white font-extrabold text-lg">
        Streitfall · Trade #{dispute.transactionId.slice(0, 8)}
      </Text>
      <Text className="text-zinc-500 text-xs mt-1">
        {dateLabel(dispute.createdAtMillis)}
      </Text>
      <Text className="text-zinc-700 dark:text-zinc-300 text-sm mt-4">
        Grund: {dispute.reason ?? 'Nicht angegeben'}
      </Text>
      <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
        {dispute.details || 'Keine zusätzlichen Details.'}
      </Text>
      <Text className="text-zinc-500 text-xs mt-3">
        Vorzustand: {dispute.previousTransactionStatus ?? 'unbekannt'}
      </Text>
      <Text className="text-zinc-500 text-xs">
        Teilnehmer: {dispute.participantIds.join(' · ')}
      </Text>

      <TextInput
        accessibilityLabel="Interne Moderationsnotiz für Streitfall"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={1500}
        placeholder="Interne Moderationsnotiz"
        placeholderTextColor="#71717a"
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white mt-4 min-h-20"
      />

      <View className="mt-3">
        <AppButton
          label="Trade sicher fortsetzen"
          disabled={busy || !dispute.previousTransactionStatus}
          onPress={() => void resolve('resume_trade')}
        />
      </View>
      <View className="mt-2">
        <AppButton
          label="Manuelle Recovery erforderlich"
          variant="danger"
          disabled={busy}
          onPress={() => void resolve('manual_recovery')}
        />
      </View>
    </AppCard>
  );
}

export default function ModerationScreen() {
  const enabled = isFeatureEnabled('internalModeratorUi');
  const [queue, setQueue] = useState<ModerationQueue | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setQueue(await loadModerationQueue());
    } catch (loadError: unknown) {
      console.error('Failed to load moderation queue', loadError);
      setError(
        'Moderationsdaten konnten nicht geladen werden. Der Backend-Claim admin/moderator ist erforderlich.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [enabled]);

  const handleResolved = async () => {
    setBusy(true);
    try {
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-950 pt-16 px-4">
        <Text className="text-black dark:text-white text-3xl font-black mb-5">
          Interne Moderation
        </Text>
        <StatusBanner
          tone="neutral"
          title="Interne Oberfläche deaktiviert"
          message="internalModeratorUi ist standardmäßig false. Auch nach Aktivierung verlangt jeder Moderations-Callable serverseitig einen Firebase Custom Claim admin oder moderator."
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 64, paddingBottom: 120 }}
    >
      <Text className="text-black dark:text-white text-3xl font-black">
        Interne Moderation
      </Text>
      <Text className="text-zinc-500 text-sm mt-2 mb-5 leading-6">
        Diese Oberfläche besitzt keine eigenen Admin-Rechte. Der Trusted Backend Claim entscheidet jede Aktion erneut.
      </Text>

      {error ? (
        <StatusBanner tone="danger" title="Kein Moderationszugriff" message={error} />
      ) : null}

      <View className="mt-4">
        <AppButton
          label="Queue aktualisieren"
          variant="secondary"
          loading={loading}
          disabled={busy}
          onPress={() => void refresh()}
        />
      </View>

      {loading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Moderations-Queue wird geladen"
          className="py-16 items-center"
        >
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : (
        <>
          <Text className="text-black dark:text-white text-xl font-extrabold mt-8 mb-3">
            Reports ({queue?.reports.length ?? 0})
          </Text>
          <View className="gap-3">
            {queue?.reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                busy={busy}
                onResolved={handleResolved}
              />
            ))}
          </View>

          <Text className="text-black dark:text-white text-xl font-extrabold mt-8 mb-3">
            Streitfälle ({queue?.disputes.length ?? 0})
          </Text>
          <View className="gap-3">
            {queue?.disputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                busy={busy}
                onResolved={handleResolved}
              />
            ))}
          </View>

          {queue && queue.reports.length === 0 && queue.disputes.length === 0 ? (
            <View className="mt-6">
              <StatusBanner
                tone="success"
                title="Keine offenen Fälle"
                message="Die aktuelle Moderations-Queue ist leer."
              />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
