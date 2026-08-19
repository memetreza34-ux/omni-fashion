import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

const FUNCTIONS_REGION = 'europe-west1';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const DELIVERY_SCHEMA_VERSION = 1;

interface PushDevice {
  id: string;
  userId: string;
  expoPushToken: string;
  enabled: boolean;
}

interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
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

function stringValue(
  record: Record<string, unknown>,
  field: string,
): string | null {
  const value = record[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function mapPushDevice(id: string, raw: unknown): PushDevice | null {
  if (!isRecord(raw)) {
    return null;
  }

  const userId = stringValue(raw, 'userId');
  const expoPushToken = stringValue(raw, 'expoPushToken');
  if (!userId || !expoPushToken || raw.enabled !== true) {
    return null;
  }

  return { id, userId, expoPushToken, enabled: true };
}

function ticketFromUnknown(value: unknown): PushTicket | null {
  if (!isRecord(value) || (value.status !== 'ok' && value.status !== 'error')) {
    return null;
  }

  const details = isRecord(value.details)
    ? {
        error:
          typeof value.details.error === 'string'
            ? value.details.error
            : undefined,
      }
    : undefined;

  return {
    status: value.status,
    id: typeof value.id === 'string' ? value.id : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
    details,
  };
}

function notificationData(raw: Record<string, unknown>) {
  const data: Record<string, string> = {};
  const fields = [
    ['type', raw.type],
    ['relatedOfferId', raw.relatedOfferId],
    ['relatedTransactionId', raw.relatedTransactionId],
    ['relatedListingId', raw.relatedListingId],
  ] as const;

  for (const [key, value] of fields) {
    if (typeof value === 'string' && value) {
      data[key] = value;
    }
  }
  return data;
}

async function claimDelivery(
  notificationId: string,
  device: PushDevice,
): Promise<string | null> {
  const db = getFirestore();
  const deliveryId = `${notificationId}_${device.id}`;
  const ref = db.collection('pushDeliveries').doc(deliveryId);

  try {
    await ref.create({
      notificationId,
      deviceId: device.id,
      userId: device.userId,
      status: 'claimed',
      expoTicketId: null,
      errorCode: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      schemaVersion: DELIVERY_SCHEMA_VERSION,
    });
    return deliveryId;
  } catch (error: unknown) {
    if (
      isRecord(error) &&
      (error.code === 6 || error.code === 'already-exists')
    ) {
      return null;
    }
    throw error;
  }
}

export const onNotificationCreatedPushDelivery = onDocumentCreated(
  {
    document: 'notifications/{notificationId}',
    region: FUNCTIONS_REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (event) => {
    const notification = event.data?.data();
    if (!notification) {
      return;
    }

    const userId = stringValue(notification, 'userId');
    const title = stringValue(notification, 'title');
    const body = stringValue(notification, 'body');
    if (!userId || !title || !body) {
      logger.warn('Skipping invalid push source notification', {
        notificationId: event.params.notificationId,
      });
      return;
    }

    ensureAdminInitialized();
    const db = getFirestore();
    const preferenceSnapshot = await db
      .collection('notificationPreferences')
      .doc(userId)
      .get();
    const preference = preferenceSnapshot.data();

    // Remote push is opt-in. In-app notifications remain available regardless.
    if (!preference || preference.pushEnabled !== true) {
      return;
    }

    const devicesSnapshot = await db
      .collection('pushDevices')
      .where('userId', '==', userId)
      .get();

    const devices = devicesSnapshot.docs
      .map((document) => mapPushDevice(document.id, document.data()))
      .filter((device): device is PushDevice => device !== null)
      .slice(0, 50);

    if (devices.length === 0) {
      return;
    }

    const claims: { device: PushDevice; deliveryId: string }[] = [];
    for (const device of devices) {
      const deliveryId = await claimDelivery(
        event.params.notificationId,
        device,
      );
      if (deliveryId) {
        claims.push({ device, deliveryId });
      }
    }

    if (claims.length === 0) {
      return;
    }

    const messages = claims.map(({ device }) => ({
      to: device.expoPushToken,
      sound: 'default' as const,
      title,
      body,
      data: notificationData(notification),
    }));

    let response: Response;
    try {
      response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (error: unknown) {
      logger.error('Expo push request failed', error);
      const batch = db.batch();
      for (const { deliveryId } of claims) {
        batch.set(
          db.collection('pushDeliveries').doc(deliveryId),
          {
            status: 'send_failed',
            errorCode: 'NETWORK_ERROR',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      await batch.commit();
      return;
    }

    if (!response.ok) {
      const errorCode = `HTTP_${response.status}`;
      logger.error('Expo push service rejected request', {
        status: response.status,
        notificationId: event.params.notificationId,
      });
      const batch = db.batch();
      for (const { deliveryId } of claims) {
        batch.set(
          db.collection('pushDeliveries').doc(deliveryId),
          {
            status: 'send_failed',
            errorCode,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      await batch.commit();
      return;
    }

    const payload: unknown = await response.json();
    const rawTickets =
      isRecord(payload) && Array.isArray(payload.data) ? payload.data : [];

    const batch = db.batch();
    for (let index = 0; index < claims.length; index += 1) {
      const claim = claims[index];
      const ticket = ticketFromUnknown(rawTickets[index]);
      const deliveryRef = db.collection('pushDeliveries').doc(claim.deliveryId);

      if (!ticket) {
        batch.set(
          deliveryRef,
          {
            status: 'send_failed',
            errorCode: 'INVALID_EXPO_RESPONSE',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        continue;
      }

      if (ticket.status === 'ok' && ticket.id) {
        batch.set(
          deliveryRef,
          {
            status: 'ticket_received',
            expoTicketId: ticket.id,
            errorCode: null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        batch.set(db.collection('pushTickets').doc(ticket.id), {
          expoTicketId: ticket.id,
          notificationId: event.params.notificationId,
          deliveryId: claim.deliveryId,
          deviceId: claim.device.id,
          userId,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          schemaVersion: DELIVERY_SCHEMA_VERSION,
        });
        batch.set(
          db.collection('pushDevices').doc(claim.device.id),
          {
            lastDeliveryAt: FieldValue.serverTimestamp(),
            lastErrorCode: null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        continue;
      }

      const errorCode = ticket.details?.error ?? 'EXPO_TICKET_ERROR';
      batch.set(
        deliveryRef,
        {
          status: 'rejected',
          errorCode,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      if (errorCode === 'DeviceNotRegistered') {
        batch.set(
          db.collection('pushDevices').doc(claim.device.id),
          {
            enabled: false,
            lastErrorCode: errorCode,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }
    await batch.commit();
  },
);
