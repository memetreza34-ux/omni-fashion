# Omni Fashion – Rollback Runbook

Status: **operational foundation; real deployment identifiers/revisions will be filled during Preview/Production setup**

## Goal

Rollback must restore a known-good state without inventing data corrections under pressure.

Omni Fashion has several independently deployable layers:

1. mobile/native build,
2. Expo/web bundle,
3. Firebase Functions,
4. Firestore Rules,
5. Storage Rules,
6. Firestore indexes,
7. feature flags / optional feature exposure,
8. third-party providers.

A rollback may affect only one layer. Do not automatically roll back everything unless the incident crosses multiple layers.

---

## 1. Incident classification

### P0 – Data integrity / account security

Examples:

- cross-user private data exposure
- unauthorized ownership mutation
- account deletion corrupts counterpart history
- swap finalizer can duplicate or lose ownership
- security rules allow prohibited writes

Action:

- stop risky feature/backend path immediately,
- disable optional feature via flag where possible,
- pause deployment/rollout,
- preserve logs/audit evidence,
- prefer fail-closed behavior,
- do not run speculative data repair scripts.

### P1 – Core flow unavailable

Examples:

- Auth fails for legitimate users
- Wardrobe cannot load
- Functions deployment breaks AI/Swap
- Preview/Production Firebase environment mismatch

Action:

- identify last known-good revision,
- roll back affected backend/build layer,
- verify with a real smoke account.

### P2 – Optional feature regression

Examples:

- native push issue
- Shop partner feed issue
- optional experimental try-on issue

Action:

- disable corresponding feature flag/preference first,
- avoid full app rollback if core remains healthy.

---

## 2. Release manifest required

For every Production release record:

```text
Git commit SHA
EAS Android build id/versionCode
EAS iOS build id/buildNumber
Firebase project id
Functions deployment time/revision
Firestore Rules source SHA
Storage Rules source SHA
Firestore indexes source SHA
feature flag snapshot
AI model/prompt version
release owner
```

Without this manifest, rollback becomes guesswork.

---

## 3. Mobile app rollback

Native store releases cannot always be instantly replaced on every installed device.

Therefore:

- backwards compatibility matters,
- backend changes must tolerate the previous supported app version,
- risky optional features must be remotely/locally disableable where practical,
- destructive schema migrations require explicit compatibility plans.

For a bad staged rollout:

1. stop/hold store rollout if the store supports it,
2. disable affected optional server feature,
3. restore backend compatibility if needed,
4. create a fixed native build from a known-good or patched SHA,
5. validate Preview/Internal track,
6. resume rollout only after validation.

Never assume deleting a store release removes it from already installed devices.

---

## 4. Functions rollback

Before each Production Functions deployment record the source SHA and deployment revision/time.

If a new Function deployment causes a P0/P1 regression:

1. identify affected functions,
2. stop user exposure with feature flag/fail-closed guard where available,
3. redeploy the last known-good Functions source from its exact commit,
4. do not mix individual source files from different commits,
5. verify Auth + affected callable/trigger with a Production-safe smoke account,
6. inspect retries/idempotency before replaying failed operations.

Special caution:

- Firestore triggers can be retried,
- notification/push delivery uses dedup/claim records,
- swap finalization uses a claim state,
- rollback must not manually delete those protection records without case analysis.

---

## 5. Firestore Rules rollback

If a Rules release accidentally grants too much access:

1. treat as P0,
2. deploy the last known-good restrictive rules immediately,
3. verify with emulator-equivalent tests and real safe smoke checks,
4. inspect audit/log evidence for unauthorized access or writes.

If a Rules release is too restrictive:

- still prefer restoring the last known-good rules rather than weakening rules ad hoc in the console.

Repository source remains the authority. Console-only emergency changes must be copied back into source immediately after the incident or reverted.

---

## 6. Storage Rules rollback

Storage contains private Wardrobe/avatar media and public Listing media.

For rule incidents:

- restore previous known-good rules,
- verify private `users/{uid}/...` remains owner-only,
- verify public Listing projection does not expose private Wardrobe objects,
- do not change bucket ACLs manually as a shortcut.

---

## 7. Firestore index changes

Adding an index is generally additive, but query changes can make an app version depend on a new index.

Rollback strategy:

- restore the previous query implementation if an index deployment is incomplete/broken,
- do not delete old indexes during an incident unless necessary,
- remove obsolete indexes only in planned maintenance after supported clients no longer require them.

---

## 8. OmniSwap incident rules

### Listing creation issue

- disable/stop listing callable if necessary,
- existing private Wardrobe data must remain unchanged,
- do not delete listings in bulk without checking offers/transactions.

### Offer issue

- protect existing locks/offer keys,
- do not clear all locks globally,
- inspect per-offer state.

### Finalization issue

If ownership migration is suspect:

- stop new finalizations,
- leave affected transaction in failed/disputed/manual-recovery state,
- preserve both old/new Storage objects until ownership is proven,
- never mark transaction completed merely to unblock UI,
- use manual recovery queue and audit trail.

### Dispute issue

- do not auto-resume disputed transactions,
- use stored `previousTransactionStatus` only through trusted moderation resolution.

---

## 9. Account deletion incident

Account deletion is destructive.

If a deployment introduces deletion uncertainty:

1. disable/hide account deletion entry point or fail the callable closed,
2. do not delete Firebase Auth first,
3. preserve deletion audit records,
4. inspect private cleanup vs shared-history pseudonymization separately,
5. never reconstruct personal data from pseudonymized history unless legally/technically justified and explicitly designed.

A failed deletion workflow must not be manually marked completed.

---

## 10. Push rollback

Remote push is optional over the In-App notification source.

If push delivery misbehaves:

- set/keep push feature disabled,
- leave In-App notifications functioning,
- stop push trigger/scheduler deployment if necessary,
- do not delete In-App notification records,
- retain push delivery/ticket records for diagnosis,
- disable invalid device tokens rather than repeatedly retrying them.

---

## 11. AI provider rollback

AI results are versioned by model/prompt metadata.

If a new provider/model/prompt regresses:

- stop new analyses or restore previous provider config,
- do not silently rewrite previously analyzed Wardrobe data in bulk,
- preserve model/prompt version fields for audit/evaluation,
- use retry only after the corrected provider is deployed.

---

## 12. Feature flags as containment

Current typed flags include:

- `nativePushRegistration`
- `internalModeratorUi`
- `shopPartnerFeed`
- `photorealisticTryOn`

These default false.

Production remote configuration is not yet implemented, so current flags are primarily code-level safety boundaries. Before optional risky features launch, add a real remotely controllable provider so disabling a feature does not always require a new store release.

---

## 13. Data repair policy

No emergency repair script may be run against Production unless it has:

- a clearly defined target set,
- dry-run/report mode,
- idempotency or explicit retry semantics,
- backup/evidence strategy where applicable,
- code review,
- named operator,
- audit output.

For Marketplace ownership, manual one-off console edits are unacceptable except under a documented emergency procedure with full audit evidence.

---

## 14. Recovery verification

After rollback verify the minimum affected matrix, not just deployment success.

Typical core smoke:

- login
- Wardrobe read
- Wardrobe private image read
- create/update safe item if appropriate
- Stylist reads Wardrobe
- Marketplace feed read
- no cross-user private data access
- affected Function succeeds/fails correctly

For a Swap incident use two test accounts.

---

## 15. Post-incident

Before declaring resolved:

- exact bad revision identified
- exact good revision restored
- user/data impact assessed
- audit/log evidence retained
- missing test added
- missing alert added
- roadmap/runbook updated
- emergency console changes reconciled back into Git

## Rule

Rollback restores a known-good system state. It is not permission to guess or overwrite ambiguous user ownership/data state.
