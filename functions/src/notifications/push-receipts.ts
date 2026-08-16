import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const FUNCTIONS_REGION = 'europe-west1';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

interface PendingTicket {
  id: string;
  deliveryId: string;
  deviceId: string;
}

interface ExpoReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function mapTicket(id: string, raw: unknown): PendingTicket | null {
  if (!isRecord(raw)) {
    return null;
  }

  const deliveryId = stringValue(raw, 'deliveryId');
  const deviceId = stringValue(raw, 'deviceId');
  if (!deliveryId || !deviceId) {
    return null;
  }
  return { id, deliveryId, deviceId };
}

function mapReceipt(raw: unknown): ExpoReceipt | null {
  if (!isRecord(raw) || (raw.status !== 'ok' && raw.status !== 'error')) {
    return null;
  }

  const details = isRecord(raw.details)
    ? {
        error:
          typeof raw.details.error === 'string' ? raw.details.error : undefined,
      }
    : undefined;

  return {
    status: raw.status,
    message: typeof raw.message === 'string' ? raw.message : undefined,
    details,
  };
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function processTicketChunk(tickets: PendingTicket[]): Promise<void> {
  if (tickets.length === 0) {
    return;
  }

  let response: Response;
  try {
    response = await fetch(EXPO_RECEIPTS_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: tickets.map((ticket) => ticket.id) }),
    });
  } catch (error: unknown) {
    logger.error('Expo receipt request failed', error);
    return;
  }

  if (!response.ok) {
    logger.error('Expo receipt service rejected request', {
      status: response.status,
    });
    return;
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !isRecord(payload.data)) {
    logger.error('Expo receipt service returned invalid payload');
    return;
  }

  const db = getFirestore();
  const batch = db.batch();
  let writes = 0;

  for (const ticket of tickets) {
    const receipt = mapReceipt(payload.data[ticket.id]);
    if (!receipt) {
      continue;
    }

    const ticketRef = db.collection('pushTickets').doc(ticket.id);
    const deliveryRef = db.collection('pushDeliveries').doc(ticket.deliveryId);

    if (receipt.status === 'ok') {
      batch.set(
        ticketRef,
        {
          status: 'receipt_ok',
          receiptErrorCode: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batch.set(
        deliveryRef,
        {
          status: 'receipt_ok',
          errorCode: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      writes += 2;
      continue;
    }

    const errorCode = receipt.details?.error ?? 'EXPO_RECEIPT_ERROR';
    batch.set(
      ticketRef,
      {
        status: 'receipt_error',
        receiptErrorCode: errorCode,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(
      deliveryRef,
      {
        status: 'receipt_error',
        errorCode,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    writes += 2;

    if (errorCode === 'DeviceNotRegistered') {
      batch.set(
        db.collection('pushDevices').doc(ticket.deviceId),
        {
          enabled: false,
          lastErrorCode: errorCode,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      writes += 1;
    }
  }

  if (writes > 0) {
    await batch.commit();
  }
}

export const processExpoPushReceipts = onSchedule(
  {
    schedule: 'every 15 minutes',
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async () => {
    ensureAdminInitialized();
    const db = getFirestore();
    const snapshot = await db
      .collection('pushTickets')
      .where('status', '==', 'pending')
      .limit(500)
      .get();

    const tickets = snapshot.docs
      .map((document) => mapTicket(document.id, document.data()))
      .filter((ticket): ticket is PendingTicket => ticket !== null);

    for (const chunk of chunks(tickets, 100)) {
      await processTicketChunk(chunk);
    }
  },
);
