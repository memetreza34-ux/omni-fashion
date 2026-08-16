import { createHash } from 'node:crypto';

import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

interface RateLimitOptions {
  uid: string;
  scope: string;
  maxAttempts: number;
  windowSeconds: number;
}

function rateLimitDocumentId(uid: string, scope: string): string {
  return createHash('sha256')
    .update(`${scope}:${uid}`)
    .digest('hex');
}

export async function enforceUserRateLimit({
  uid,
  scope,
  maxAttempts,
  windowSeconds,
}: RateLimitOptions): Promise<void> {
  if (maxAttempts <= 0 || windowSeconds <= 0) {
    throw new Error('Invalid rate-limit configuration.');
  }

  const db = getFirestore();
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const ref = db.collection('rateLimits').doc(rateLimitDocumentId(uid, scope));

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const startedAtMs =
      data && typeof data.windowStartedAtMs === 'number'
        ? data.windowStartedAtMs
        : null;
    const count =
      data && typeof data.count === 'number' && Number.isInteger(data.count)
        ? data.count
        : 0;

    const windowExpired =
      startedAtMs === null || nowMs - startedAtMs >= windowMs;

    if (windowExpired) {
      transaction.set(ref, {
        userId: uid,
        scope,
        count: 1,
        windowStartedAtMs: nowMs,
        expiresAt: Timestamp.fromMillis(nowMs + windowMs + 24 * 60 * 60 * 1000),
        updatedAt: Timestamp.fromMillis(nowMs),
      });
      return;
    }

    if (count >= maxAttempts) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((startedAtMs + windowMs - nowMs) / 1000),
      );
      throw new HttpsError(
        'resource-exhausted',
        'Zu viele Anfragen. Bitte später erneut versuchen.',
        { retryAfterSeconds, scope },
      );
    }

    transaction.update(ref, {
      count: count + 1,
      expiresAt: Timestamp.fromMillis(startedAtMs + windowMs + 24 * 60 * 60 * 1000),
      updatedAt: Timestamp.fromMillis(nowMs),
    });
  });
}
