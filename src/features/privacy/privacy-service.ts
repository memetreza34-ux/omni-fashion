import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

export interface AccountDeletionReadiness {
  ready: boolean;
  blockers: string[];
  recentAuthentication: boolean;
  recentAuthenticationWindowSeconds: number;
}

export interface PersonalDataExport {
  schemaVersion: number;
  exportedAt: string;
  userId: string;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function getAccountDeletionReadiness(): Promise<AccountDeletionReadiness> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    Record<string, never>,
    AccountDeletionReadiness
  >(functions, 'getAccountDeletionReadiness');
  const response = await callable({});

  if (
    !isRecord(response.data) ||
    typeof response.data.ready !== 'boolean' ||
    !Array.isArray(response.data.blockers) ||
    response.data.blockers.some((value) => typeof value !== 'string') ||
    typeof response.data.recentAuthentication !== 'boolean' ||
    typeof response.data.recentAuthenticationWindowSeconds !== 'number'
  ) {
    throw new Error('PRIVACY_INVALID_DELETION_READINESS');
  }

  return {
    ready: response.data.ready,
    blockers: response.data.blockers,
    recentAuthentication: response.data.recentAuthentication,
    recentAuthenticationWindowSeconds:
      response.data.recentAuthenticationWindowSeconds,
  };
}

export async function exportMyData(): Promise<PersonalDataExport> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<Record<string, never>, PersonalDataExport>(
    functions,
    'exportMyData',
  );
  const response = await callable({});

  if (
    !isRecord(response.data) ||
    typeof response.data.schemaVersion !== 'number' ||
    typeof response.data.exportedAt !== 'string' ||
    typeof response.data.userId !== 'string'
  ) {
    throw new Error('PRIVACY_INVALID_EXPORT_RESPONSE');
  }

  return response.data;
}

export async function deleteMyAccount(): Promise<void> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    Record<string, never>,
    { deleted: true; pseudonymizedHistoricalDocuments: number }
  >(functions, 'deleteMyAccount');
  const response = await callable({});

  if (
    !isRecord(response.data) ||
    response.data.deleted !== true ||
    typeof response.data.pseudonymizedHistoricalDocuments !== 'number'
  ) {
    throw new Error('PRIVACY_INVALID_DELETE_RESPONSE');
  }
}
