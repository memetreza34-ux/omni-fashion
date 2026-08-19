# Admin Moderation

Status: **trusted backend foundation implemented; internal moderator UI not yet built**

## Access model

Moderation is not enabled through a hidden client switch.

Trusted moderation callables require a Firebase Auth custom claim:

```text
admin === true
or
moderator === true
```

A normal authenticated user receives `permission-denied`.

The claim guard has a Functions unit test.

## Queue

`listModerationQueue` returns a bounded server-side view of open:

- user/listing/transaction reports
- OmniSwap disputes

Clients cannot enumerate the underlying `reports` collection directly.

The future internal moderator surface should call this backend rather than weaken Firestore rules.

## Report resolution

`resolveModerationReport`

Supported initial outcomes:

- `dismissed`
- `action_required`

The command:

1. requires moderator/admin claim,
2. requires an open report,
3. resolves it inside a Firestore transaction,
4. stores moderator id, resolution, note and timestamp,
5. creates a `moderationAudit` record atomically.

`action_required` is an escalation marker, not an automatic account ban.

## Dispute snapshot

When a user opens an OmniSwap dispute, the dispute stores:

```text
previousTransactionStatus
```

This is the exact valid trade status before `swapTransaction.status` becomes `disputed`.

The dispute also has explicit resolution fields initialized to null.

## Dispute resolution

`resolveSwapDispute`

Supported initial outcomes:

### `resume_trade`

Use only when moderation determines that the trade can safely continue.

The backend validates the dispute is still open and restores the stored pre-dispute transaction status.

### `manual_recovery`

The moderation record is resolved but the transaction remains `disputed`.

This is deliberate. Omni Fashion must not guess how to reverse a trade after a physical item may already have been shipped or handed over.

A later recovery/support workflow must handle these cases explicitly.

## Audit log

Every moderation decision creates a server-only `moderationAudit` record containing:

- actor id
- action
- target type/id
- outcome
- moderator note
- timestamp
- schema version

Normal clients receive no direct Firestore access to the audit collection through the default-deny boundary.

## Explicitly not implemented yet

- account suspension / ban lifecycle
- automated listing removal as a moderation outcome
- refunds or shipping reimbursement
- automatic trade reversal
- appeals
- moderator role-management UI
- moderation dashboards / metrics
- attachment evidence
- support chat

These require recovery, authorization and legal/product rules before production use.

## Next moderation steps

1. Build an internal-only moderator surface against the trusted callables.
2. Define user/account suspension states and appeal policy.
3. Add listing takedown action with audit trail.
4. Build manual trade recovery workflow.
5. Add evidence/attachment model if required.
6. Add moderation SLA/monitoring.
7. Perform privilege and abuse tests with real Firebase custom claims.
