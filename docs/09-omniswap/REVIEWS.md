# OmniSwap Reviews

Status: **real implemented foundation**

## Goal

Reviews are attached to a real, fully completed OmniSwap transaction. They are not generic profile likes and cannot be created before the two-way ownership transfer succeeds.

## Eligibility

A review can be submitted only when:

1. the caller is authenticated,
2. the referenced `swapTransaction` exists,
3. the caller is one of the two participants,
4. `status === completed`,
5. `finalizationState === completed`,
6. the caller has not already reviewed this transaction.

## Identity

The review document id is deterministic:

```text
{transactionId}_{reviewerId}
```

This gives one review per participant and transaction and provides a stable client subscription target.

## Stored review

```text
reviews/{reviewId}
- transactionId
- reviewerId
- revieweeId
- rating: 1..5
- comment: max 500 chars
- createdAt
- schemaVersion
```

`revieweeId` is derived by the trusted backend from the transaction participants. The client cannot choose whom it is rating.

## Backend boundary

`submitSwapReview` is a Firebase callable. Normal clients cannot create, update or delete review documents directly.

The callable validates the completed trade and writes the review inside a Firestore transaction so duplicate submissions cannot race successfully.

## App behavior

The transaction card shows the review action only after the trade is completely finalized.

The client subscribes to the deterministic review document. After a successful submission, the UI switches from the rating form to the persisted rating instead of repeatedly calling the backend and receiving `already-exists`.

## Current UI

- 1–5 rating
- optional text comment
- 500-character limit
- loading and failure states
- persisted `already reviewed` state

## Not yet part of this block

- public aggregate reputation score
- moderation of review text
- review appeals
- weighted trust scoring
- seller tiers or badges

Those should be added only after real production trade volume exists and abuse/moderation requirements are measurable.
