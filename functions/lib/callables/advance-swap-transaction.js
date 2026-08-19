import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { finalizeSwapTransaction } from '../swap/finalize-swap-transaction.js';
import { applySwapProgressAction, SwapProgressError, } from '../swap/transaction-state.js';
const FUNCTIONS_REGION = 'europe-west1';
const TRANSACTION_SCHEMA_VERSION = 2;
function ensureAdminInitialized() {
    if (getApps().length === 0) {
        initializeApp();
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function parseId(value) {
    if (typeof value !== 'string' ||
        !value.trim() ||
        value.length > 180 ||
        value.includes('/')) {
        throw new HttpsError('invalid-argument', 'Ungültige Transaction-ID.');
    }
    return value.trim();
}
function parseAction(value) {
    if (!isRecord(value) || typeof value.type !== 'string') {
        throw new HttpsError('invalid-argument', 'Ungültige Trade-Aktion.');
    }
    if (value.type === 'confirm_mode') {
        if (value.mode !== 'shipping' && value.mode !== 'meetup') {
            throw new HttpsError('invalid-argument', 'Ungültiger Übergabemodus.');
        }
        return { type: 'confirm_mode', mode: value.mode };
    }
    if (value.type === 'mark_shipped' ||
        value.type === 'mark_received' ||
        value.type === 'retry_finalize') {
        return { type: value.type };
    }
    throw new HttpsError('invalid-argument', 'Ungültige Trade-Aktion.');
}
function parseRequest(data) {
    if (!isRecord(data)) {
        throw new HttpsError('invalid-argument', 'Ungültige Trade-Anfrage.');
    }
    return {
        transactionId: parseId(data.transactionId),
        action: parseAction(data.action),
    };
}
function requiredString(record, field) {
    const value = record[field];
    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpsError('failed-precondition', `Feld ${field} fehlt.`);
    }
    return value.trim();
}
function stringArray(record, field) {
    const value = record[field];
    if (!Array.isArray(value) ||
        value.some((entry) => typeof entry !== 'string')) {
        throw new HttpsError('failed-precondition', `Feld ${field} ist ungültig.`);
    }
    return value;
}
function parseParticipants(value) {
    if (!Array.isArray(value) ||
        value.length !== 2 ||
        typeof value[0] !== 'string' ||
        typeof value[1] !== 'string' ||
        !value[0] ||
        !value[1] ||
        value[0] === value[1]) {
        throw new HttpsError('failed-precondition', 'Trade-Teilnehmer sind ungültig.');
    }
    return [value[0], value[1]];
}
function parseMode(value) {
    if (value === null) {
        return null;
    }
    if (value === 'shipping' || value === 'meetup') {
        return value;
    }
    throw new HttpsError('failed-precondition', 'Übergabemodus ist ungültig.');
}
function parseStatus(value) {
    if (value === 'accepted' ||
        value === 'address_or_meetup' ||
        value === 'shipped' ||
        value === 'received' ||
        value === 'completed' ||
        value === 'cancelled' ||
        value === 'disputed') {
        return value;
    }
    throw new HttpsError('failed-precondition', 'Trade-Status ist ungültig.');
}
function parseFinalizationState(value) {
    if (value === 'pending' ||
        value === 'ready' ||
        value === 'processing' ||
        value === 'completed' ||
        value === 'failed') {
        return value;
    }
    throw new HttpsError('failed-precondition', 'Finalisierungsstatus ist ungültig.');
}
function parseProgress(data) {
    if (data.schemaVersion !== TRANSACTION_SCHEMA_VERSION) {
        throw new HttpsError('failed-precondition', 'Diese Trade-Version muss vor der Fortsetzung migriert werden.');
    }
    return {
        participantIds: parseParticipants(data.participantIds),
        fulfilmentMode: parseMode(data.fulfilmentMode),
        modeConfirmedByIds: stringArray(data, 'modeConfirmedByIds'),
        shippedByIds: stringArray(data, 'shippedByIds'),
        receivedByIds: stringArray(data, 'receivedByIds'),
        status: parseStatus(data.status),
        finalizationState: parseFinalizationState(data.finalizationState),
    };
}
function validateModeAllowed(listing, mode) {
    if (mode === 'shipping' && listing.shippingEnabled !== true) {
        throw new HttpsError('failed-precondition', 'Versand ist für dieses Listing nicht freigegeben.');
    }
    if (mode === 'meetup' && listing.meetupEnabled !== true) {
        throw new HttpsError('failed-precondition', 'Persönliche Übergabe ist für dieses Listing nicht freigegeben.');
    }
}
export const advanceSwapTransaction = onCall({
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
    memory: '512MiB',
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }
    const input = parseRequest(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    const transactionRef = db
        .collection('swapTransactions')
        .doc(input.transactionId);
    let updatedState;
    try {
        updatedState = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(transactionRef);
            if (!snapshot.exists) {
                throw new HttpsError('not-found', 'Trade wurde nicht gefunden.');
            }
            const data = snapshot.data();
            if (!data) {
                throw new HttpsError('internal', 'Trade konnte nicht gelesen werden.');
            }
            const current = parseProgress(data);
            if (!current.participantIds.includes(uid)) {
                throw new HttpsError('permission-denied', 'Du bist kein Teilnehmer dieses Trades.');
            }
            if (input.action.type === 'confirm_mode') {
                const listingId = requiredString(data, 'listingId');
                const listingSnapshot = await transaction.get(db.collection('swapListings').doc(listingId));
                const listing = listingSnapshot.data();
                if (!listing) {
                    throw new HttpsError('failed-precondition', 'Das zugehörige Listing fehlt.');
                }
                validateModeAllowed(listing, input.action.mode);
            }
            const next = applySwapProgressAction(current, uid, input.action);
            transaction.update(transactionRef, {
                fulfilmentMode: next.fulfilmentMode,
                modeConfirmedByIds: next.modeConfirmedByIds,
                shippedByIds: next.shippedByIds,
                receivedByIds: next.receivedByIds,
                status: next.status,
                finalizationState: next.finalizationState,
                finalizationErrorCode: input.action.type === 'retry_finalize'
                    ? null
                    : (data.finalizationErrorCode ?? null),
                updatedAt: FieldValue.serverTimestamp(),
            });
            return next;
        });
    }
    catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        if (error instanceof SwapProgressError) {
            throw new HttpsError('failed-precondition', error.message, {
                code: error.code,
            });
        }
        logger.error('Failed to advance OmniSwap transaction', error);
        throw new HttpsError('internal', 'Trade-Fortschritt konnte nicht gespeichert werden.');
    }
    if (updatedState.finalizationState === 'ready') {
        try {
            await finalizeSwapTransaction(input.transactionId);
        }
        catch (error) {
            logger.error('Automatic OmniSwap finalization failed', error);
            throw new HttpsError('internal', 'Der Tausch wurde bestätigt, aber die Eigentumsübertragung konnte nicht sicher abgeschlossen werden. Ein erneuter Abschlussversuch ist möglich.');
        }
    }
    const latestSnapshot = await transactionRef.get();
    const latest = latestSnapshot.data();
    if (!latest) {
        throw new HttpsError('internal', 'Trade-Status konnte nicht erneut geladen werden.');
    }
    return {
        transactionId: input.transactionId,
        status: parseStatus(latest.status),
        finalizationState: parseFinalizationState(latest.finalizationState),
    };
});
//# sourceMappingURL=advance-swap-transaction.js.map