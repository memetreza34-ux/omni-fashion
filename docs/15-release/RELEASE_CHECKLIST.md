# Omni Fashion – Release Candidate Checklist

Status: **pre-release gate; nothing in this document implies that the current branch is store-ready**

A Release Candidate may be created only when every mandatory item below is explicitly verified.

## A. Source control

- [ ] target commit SHA recorded
- [ ] PR reviewed
- [ ] no unresolved critical review comments
- [ ] working PR/head is mergeable
- [ ] no uncommitted/local-only production configuration
- [ ] changelog/release notes prepared

## B. Automated Quality

All GitHub jobs must be green on the exact candidate SHA:

- [ ] TypeScript + zero-any
- [ ] Expo Router production web bundle
- [ ] Functions typecheck/build/unit tests
- [ ] Firebase Auth/Firestore/Storage Emulator Security tests
- [ ] Trust & Safety regression tests
- [ ] Push infrastructure regression tests

Do not use an older green run to approve a newer candidate SHA.

## C. Firebase Preview

- [ ] Firebase Preview project selected intentionally
- [ ] Email/Password Auth enabled
- [ ] Firestore created
- [ ] Storage created
- [ ] current rules deployed
- [ ] current indexes deployed
- [ ] current Functions deployed
- [ ] AI provider secret configured on server only
- [ ] App Check Preview configuration validated
- [ ] budget/usage alerts configured

## D. EAS / Native identity

- [ ] real EAS project linked
- [ ] permanent Android package selected
- [ ] permanent iOS bundle identifier selected
- [ ] package/bundle identifiers committed to app config
- [ ] Preview environment variables verified
- [ ] Production environment variables verified separately
- [ ] signing credentials exist and ownership is documented
- [ ] no secret stored in `EXPO_PUBLIC_*`

## E. Authentication E2E

On real Preview builds:

- [ ] new registration
- [ ] email verification
- [ ] verification resend cooldown
- [ ] login
- [ ] logout
- [ ] app restart preserves expected session behavior
- [ ] password reset
- [ ] invalid credentials do not leak account details
- [ ] sensitive Privacy action requires reauthentication

## F. Wardrobe E2E

- [ ] camera capture Android
- [ ] camera capture iOS
- [ ] gallery import Android
- [ ] gallery import iOS
- [ ] private image upload
- [ ] Firestore item creation
- [ ] AI analysis success
- [ ] AI analysis failure/retry
- [ ] update metadata
- [ ] delete item
- [ ] delete blocked while item is active in OmniSwap
- [ ] reconnect/restart behavior
- [ ] 50+ item scrolling has no obvious frame/memory regression

## G. Stylist E2E

- [ ] StyleProfile questionnaire persists
- [ ] Wardrobe signals refresh
- [ ] Top + Bottom + Shoes recommendation
- [ ] Dress + Shoes recommendation
- [ ] missing-category state is honest
- [ ] weather success
- [ ] weather failure/fallback
- [ ] save outfit
- [ ] like/dislike/worn feedback persists

## H. OmniSwap two-user E2E

Use two real accounts, preferably two physical devices.

- [ ] User A creates listing
- [ ] User B sees listing
- [ ] public image is available without exposing private Wardrobe path
- [ ] User B sends offer
- [ ] same offered item cannot be reused in another open offer
- [ ] User A accepts
- [ ] competing offers expire
- [ ] both participants choose supported fulfilment mode
- [ ] shipping progress works for both sides
- [ ] meetup progress works for both sides
- [ ] received confirmation rules are enforced
- [ ] second receipt starts finalization
- [ ] private images copied to new owner paths
- [ ] ownerId + imagePath swap atomically
- [ ] listing becomes traded
- [ ] transaction becomes completed only after successful migration
- [ ] review appears only after completion
- [ ] duplicate review rejected

## I. Trust & Safety / Moderation

- [ ] listing report creates private moderation record
- [ ] block hides account listings
- [ ] blocked users cannot create new offers between each other
- [ ] dispute stops normal trade progress
- [ ] moderator claim required for moderation queue
- [ ] normal user receives permission denied
- [ ] report resolution creates audit record
- [ ] safe resume restores pre-dispute status
- [ ] manual recovery leaves trade blocked

## J. Notifications

### In-App

- [ ] offer notification
- [ ] accept/decline/cancel notification
- [ ] fulfilment progress notifications
- [ ] completion notification
- [ ] dispute notification
- [ ] read state
- [ ] duplicate trigger does not duplicate inbox event

### Remote Push – only if enabled for this release

- [ ] `expo-notifications` installed with SDK-compatible version
- [ ] real push credentials
- [ ] physical Android token
- [ ] physical iOS token
- [ ] explicit user opt-in
- [ ] push send ticket recorded
- [ ] receipt becomes successful
- [ ] invalid device token becomes disabled
- [ ] push disabled preference leaves In-App notification intact

If native push is not completed, the feature flag/preference must keep it unavailable rather than partially working.

## K. Privacy / Account Lifecycle

- [ ] personal data export succeeds
- [ ] export excludes raw credentials/tokens
- [ ] active listing blocks deletion
- [ ] sent offer blocks deletion
- [ ] open/disputed trade blocks deletion
- [ ] completed trade permits deletion
- [ ] fresh authentication required
- [ ] confirmation UX works
- [ ] private Firestore data removed
- [ ] `users/{uid}/` Storage removed
- [ ] shared completed Marketplace history remains internally consistent
- [ ] deleted user identifiers/text are pseudonymized/redacted as designed
- [ ] Firebase Auth account removed last
- [ ] legal/retention review approves the final policy

## L. Accessibility

- [ ] VoiceOver critical flows
- [ ] TalkBack critical flows
- [ ] large text / Dynamic Type
- [ ] buttons remain usable with larger text
- [ ] color contrast Light mode
- [ ] color contrast Dark mode
- [ ] forms announce errors
- [ ] modals/focus usable
- [ ] critical icon-only controls have accessible names
- [ ] destructive actions clearly announced

## M. Performance

- [ ] cold start measured
- [ ] Wardrobe 50/250 items tested
- [ ] Marketplace 100 listings tested
- [ ] Activity 100 notifications tested
- [ ] Stylist ranking measured on large wardrobe
- [ ] image memory tested on mid-range Android
- [ ] no obvious JS-thread stall in core navigation
- [ ] upload size/compression policy finalized

## N. Observability / Operations

- [ ] crash provider connected or explicit launch exception approved
- [ ] analytics provider connected or explicit launch exception approved
- [ ] production error reporting verified
- [ ] Firebase/Functions usage monitoring
- [ ] AI cost monitoring
- [ ] abuse/rate monitoring plan
- [ ] recovery queue owner assigned
- [ ] moderation queue owner assigned
- [ ] incident contact/owner assigned

## O. Store / Legal

- [ ] Privacy Policy finalized
- [ ] Terms/Marketplace rules finalized if required
- [ ] retention policy finalized
- [ ] Apple privacy answers prepared
- [ ] Google Play Data Safety prepared
- [ ] screenshots/assets finalized
- [ ] store descriptions do not claim unavailable AI/3D/shop features
- [ ] support URL/contact ready
- [ ] account deletion information meets store requirements

## P. Rollback readiness

- [ ] rollback runbook reviewed
- [ ] previous stable app build identified
- [ ] previous stable Functions deployment/revision identifiable
- [ ] rules/index rollback path understood
- [ ] feature flags can disable risky optional features
- [ ] irreversible schema/data migration absent or migration rollback documented

## Final Release Candidate rule

A build becomes a Release Candidate only after the exact source SHA, Firebase backend revision and native build identifiers can be tied together and reproduced.
