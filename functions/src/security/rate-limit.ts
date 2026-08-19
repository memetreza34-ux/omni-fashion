import { createHash } from 'node:crypto';

import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

const RATE_LIMIT_SCHEMA_VERSION = 1;

interface RateLimitOptions {
  uid: string;
  scope: string;
  maxAttempts: number;
  windowSeconds: number;
}

export interface RateLimitWindowState {
  startedAtMs: number;
  count: number;
}

export interface RateLimitEvaluation {
  allowed: boolean;
  nextState: RateLimitWindowState;
  retryAfterSeconds: number | null;
}

function rateLimitDocumentId(uid: string, scope: string): string {
  return createHash('sha256').update(`${scope}:${uid}`).digest('hex');
}

function validOptions(options: RateLimitOptions): boolean {
  return (
    Boolean(options.uid) &&
    /^[a-z0-9_-]{2,80}$/i.test(options.scope) &&
    Number.isInteger(options.maxAttempts) &&
    options.maxAttempts > 0 &&
    Number.isInteger(options.windowSeconds) &&
    options.windowSeconds > 0
  );
}

export function evaluateRateLimitWindow(
  state: RateLimitWindowState | null,
  nowMs: number,
  maxAttempts: number,
  windowMs: number,
): RateLimitEvaluation {
  const invalidOrExpired =
    !state ||
    state.count < 0 ||
    state.startedAtMs > nowMs ||
    nowMs - state.startedAtMs >= windowMs;

  if (invalidOrExpired) {
    return {
      allowed: true,
      nextState: { startedAtMs: nowMs, count: 1 },
      retryAfterSeconds: null,
    };
  }

  if (state.count >= maxAttempts) {
    return {
      allowed: false,
      nextState: state,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((state.startedAtMs + windowMs - nowMs) / 1000),
      ),
    };
  }

  return {
    allowed: true,
    nextState: {
      startedAtMs: state.startedAtMs,
      count: state.count + 1,
    },
    retryAfterSeconds: null,
  };
}

export async function enforceUserRateLimit(
  options: RateLimitOptions,
): Promise<void> {
  if (!validOptions(options)) {
    throw new Error('Invalid rate-limit configuration.');
  }

  const { uid, scope, maxAttempts, windowSeconds } = options;
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
        : null;

    const currentState =
      startedAtMs !== null && count !== null ? { startedAtMs, count } : null;
    const evaluation = evaluateRateLimitWindow(
      currentState,
      nowMs,
      maxAttempts,
      windowMs,
    );

    if (!evaluation.allowed) {
      throw new HttpsError(
        'resource-exhausted',
        'Zu viele Anfragen. Bitte später erneut versuchen.',
        {
          retryAfterSeconds: evaluation.retryAfterSeconds,
          scope,
        },
      );
    }

    transaction.set(ref, {
      userId: uid,
      scope,
      count: evaluation.nextState.count,
      windowStartedAtMs: evaluation.nextState.startedAtMs,
      expiresAt: Timestamp.fromMillis(
        evaluation.nextState.startedAtMs + windowMs + 24 * 60 * 60 * 1000,
      ),
      updatedAt: Timestamp.fromMillis(nowMs),
      schemaVersion: RATE_LIMIT_SCHEMA_VERSION,
    });
  });
}
