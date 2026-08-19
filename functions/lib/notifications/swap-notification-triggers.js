import { logger } from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated, } from 'firebase-functions/v2/firestore';
import { createUserNotification } from './create-notification.js';
const FUNCTIONS_REGION = 'europe-west1';
function stringValue(record, field) {
    const value = record[field];
    return typeof value === 'string' && value ? value : null;
}
function stringArray(value) {
    return Array.isArray(value)
        ? value.filter((entry) => typeof entry === 'string')
        : [];
}
async function safelyCreate(input) {
    try {
        await createUserNotification(input);
    }
    catch (error) {
        logger.error('Failed to create OmniSwap notification', error);
    }
}
export const onSwapOfferCreated = onDocumentCreated({
    document: 'swapOffers/{offerId}',
    region: FUNCTIONS_REGION,
}, async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const listingOwnerId = stringValue(data, 'listingOwnerId');
    const offerId = event.params.offerId;
    const listingId = stringValue(data, 'requestedListingId');
    if (!listingOwnerId || !listingId)
        return;
    await safelyCreate({
        userId: listingOwnerId,
        dedupeKey: `swap-offer-received:${offerId}`,
        type: 'swap_offer_received',
        title: 'Neues Tauschangebot',
        body: 'Für eines deiner OmniSwap-Listings ist ein neues Tauschangebot eingegangen.',
        relatedOfferId: offerId,
        relatedListingId: listingId,
    });
});
export const onSwapOfferUpdated = onDocumentUpdated({
    document: 'swapOffers/{offerId}',
    region: FUNCTIONS_REGION,
}, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status)
        return;
    const requesterId = stringValue(after, 'requesterId');
    const listingOwnerId = stringValue(after, 'listingOwnerId');
    const offerId = event.params.offerId;
    const listingId = stringValue(after, 'requestedListingId');
    if (after.status === 'accepted' && requesterId) {
        await safelyCreate({
            userId: requesterId,
            dedupeKey: `swap-offer-accepted:${offerId}`,
            type: 'swap_offer_accepted',
            title: 'Tauschangebot angenommen',
            body: 'Dein OmniSwap-Angebot wurde angenommen. Jetzt beginnt die sichere Übergabe.',
            relatedOfferId: offerId,
            relatedTransactionId: stringValue(after, 'transactionId'),
            relatedListingId: listingId,
        });
    }
    else if (after.status === 'declined' && requesterId) {
        await safelyCreate({
            userId: requesterId,
            dedupeKey: `swap-offer-declined:${offerId}`,
            type: 'swap_offer_declined',
            title: 'Tauschangebot abgelehnt',
            body: 'Dein OmniSwap-Angebot wurde abgelehnt. Dein angebotenes Teil ist wieder frei.',
            relatedOfferId: offerId,
            relatedListingId: listingId,
        });
    }
    else if (after.status === 'cancelled' && listingOwnerId) {
        await safelyCreate({
            userId: listingOwnerId,
            dedupeKey: `swap-offer-cancelled:${offerId}`,
            type: 'swap_offer_cancelled',
            title: 'Tauschangebot zurückgezogen',
            body: 'Ein offenes OmniSwap-Angebot wurde von der anfragenden Person zurückgezogen.',
            relatedOfferId: offerId,
            relatedListingId: listingId,
        });
    }
});
export const onSwapTransactionUpdated = onDocumentUpdated({
    document: 'swapTransactions/{transactionId}',
    region: FUNCTIONS_REGION,
}, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    const participants = stringArray(after.participantIds);
    if (participants.length !== 2)
        return;
    const transactionId = event.params.transactionId;
    const offerId = stringValue(after, 'offerId');
    const listingId = stringValue(after, 'listingId');
    const eventForNewActor = async (beforeValues, afterValues, kind) => {
        const previous = new Set(stringArray(beforeValues));
        const current = stringArray(afterValues);
        const newlyAdded = current.filter((id) => !previous.has(id));
        for (const actorId of newlyAdded) {
            const recipientId = participants.find((id) => id !== actorId);
            if (!recipientId)
                continue;
            if (kind === 'mode') {
                await safelyCreate({
                    userId: recipientId,
                    dedupeKey: `swap-mode-confirmed:${transactionId}:${actorId}`,
                    type: 'swap_mode_confirmed',
                    title: 'Tauschweg bestätigt',
                    body: 'Die andere Person hat den Tauschweg für euren OmniSwap-Trade bestätigt.',
                    relatedOfferId: offerId,
                    relatedTransactionId: transactionId,
                    relatedListingId: listingId,
                });
            }
            else if (kind === 'shipped') {
                await safelyCreate({
                    userId: recipientId,
                    dedupeKey: `swap-shipped:${transactionId}:${actorId}`,
                    type: 'swap_item_shipped',
                    title: 'Versand bestätigt',
                    body: 'Die andere Person hat bestätigt, dass ihr Kleidungsstück versendet wurde.',
                    relatedOfferId: offerId,
                    relatedTransactionId: transactionId,
                    relatedListingId: listingId,
                });
            }
            else {
                await safelyCreate({
                    userId: recipientId,
                    dedupeKey: `swap-received:${transactionId}:${actorId}`,
                    type: 'swap_item_received',
                    title: 'Empfang bestätigt',
                    body: 'Die andere Person hat den Empfang des getauschten Kleidungsstücks bestätigt.',
                    relatedOfferId: offerId,
                    relatedTransactionId: transactionId,
                    relatedListingId: listingId,
                });
            }
        }
    };
    await eventForNewActor(before.modeConfirmedByIds, after.modeConfirmedByIds, 'mode');
    await eventForNewActor(before.shippedByIds, after.shippedByIds, 'shipped');
    await eventForNewActor(before.receivedByIds, after.receivedByIds, 'received');
    if (before.status !== 'completed' && after.status === 'completed') {
        await Promise.all(participants.map((userId) => safelyCreate({
            userId,
            dedupeKey: `swap-completed:${transactionId}`,
            type: 'swap_completed',
            title: 'Tausch abgeschlossen',
            body: 'OmniSwap hat den Tausch sicher abgeschlossen und die Kleidungsstücke in die neuen Schränke übertragen.',
            relatedOfferId: offerId,
            relatedTransactionId: transactionId,
            relatedListingId: listingId,
        })));
    }
});
export const onSwapDisputeCreated = onDocumentCreated({
    document: 'swapDisputes/{transactionId}',
    region: FUNCTIONS_REGION,
}, async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const participants = stringArray(data.participantIds);
    const openedById = stringValue(data, 'openedById');
    if (participants.length !== 2 || !openedById)
        return;
    const recipientId = participants.find((id) => id !== openedById);
    if (!recipientId)
        return;
    await safelyCreate({
        userId: recipientId,
        dedupeKey: `swap-disputed:${event.params.transactionId}`,
        type: 'swap_disputed',
        title: 'Klärungsfall geöffnet',
        body: 'Für euren OmniSwap-Trade wurde ein Klärungsfall geöffnet. Der normale Trade-Fortschritt ist gestoppt.',
        relatedTransactionId: event.params.transactionId,
    });
});
//# sourceMappingURL=swap-notification-triggers.js.map