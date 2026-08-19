# E2E Test Infra: Omni-Fashion Super-App

## Test Philosophy

- Opaque-box, requirement-driven testing.
- Independent of internal implementation details.
- 4-Tier test suite structure executed via Node.js native test runner (`node --test`).

## Feature Inventory & Test Coverage

| #   | Feature                                          | Source (requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| --- | ------------------------------------------------ | -------------------- | :----: | :----: | :----: | :----: |
| 1   | Competitor Analysis & Standout Feature Selection | R1                   |   5    |   5    |   ✓    |   ✓    |
| 2   | High-End UI/UX Design & Layouts                  | R2                   |   5    |   5    |   ✓    |   ✓    |
| 3   | Strict TypeScript Verification (`tsc --noEmit`)  | R3                   |   5    |   5    |   ✓    |   ✓    |
| 4   | Zero `any` Types Verification                    | R3                   |   5    |   5    |   ✓    |   ✓    |
| 5   | OmniSwap Hub Feature Workflows                   | R1                   |   5    |   5    |   ✓    |   ✓    |

## Test Architecture

- Framework: Node native runner `node --test tests/**/*.test.ts`
- TypeScript Verification: `npx tsc --noEmit`
- Strict `any` Audit: `node scripts/check-no-any.js`
- Unified Verification Command: `npm run verify:quality` or `node scripts/check-no-any.js && npx tsc --noEmit && node --test tests/**/*.test.ts`

## Test Tier Definitions

- Tier 1: Feature Coverage (Data model integrity, screen export checks, tab route mapping).
- Tier 2: Boundary & Corner Cases (Empty trade proposals, zero impact values, edge condition types).
- Tier 3: Cross-Feature Combinations (Swap deck interaction state transition to trade offer modal).
- Tier 4: Real-World Scenarios (Complete user swap workflow from deck swipe to trade proposal submission and eco calculation update).
