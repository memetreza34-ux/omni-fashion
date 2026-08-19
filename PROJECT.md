# Project: Omni-Fashion Super-App

## Architecture

Omni-Fashion is an Expo React Native / Web Super-App built with Expo Router, React Native Reanimated, NativeWind v4 (TailwindCSS), and Lucide React Native icons. The app is expanded with the standout feature **OmniSwap Hub** — a cashless circular social swapping & wardrobe exchange platform designed to surpass competitors Whering, Acloset, and Cladwell.

### Data Flow & Component Architecture

- `src/types/swap.ts`: Strict TypeScript type definitions for `SwapItem`, `SwapTradeProposal`, `UserSwapProfileStats`, `EcoImpactMetrics`. Zero `any`.
- `src/data/swap-data.ts`: Rich mock dataset containing premium peer items, active trade offers, community eco counters, and user swap profiles.
- `src/components/swap/`:
  - `SwapDeckCard.tsx`: Tinder-style interactive item card with condition badges, aesthetic tags, micro-animations, and swipe actions (Pass / Swap Request / Saved).
  - `TradeStudioModal.tsx`: Negotiation modal for offering items, calculating instant eco-savings (CO₂ & H₂O), and submitting swap proposals.
  - `ClosetHubView.tsx`: Peer wardrobe browser categorized by style archetype, size, and location.
  - `EcoImpactBanner.tsx`: Animated live banner showcasing total community circular impact.
- `src/app/swap.tsx`: Dedicated screen for OmniSwap Hub.
- `src/components/app-tabs.web.tsx`: Updated tab navigation supporting all 5 super-app tabs (`Schrank`, `Stylist`, `Shop`, `OmniSwap`, `Profil`).

## Feature Inventory

| #   | Feature                                          | Description                                                                                                    | Milestone | Source      |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 1   | Competitor Analysis & Standout Feature Selection | Selected OmniSwap Hub (Circular Social Swapping) for max market advantage                                      | M1        | survey      |
| 2   | Strict TypeScript Quality & Zero `any`           | Clean build (`npx tsc --noEmit` exit 0), automated zero `any` script (`check-no-any.js`), starter code cleanup | M1        | requirement |
| 3   | Data Schemas & Mock Dataset                      | Fully typed swap data model and mock data for immediate presentation                                           | M1        | requirement |
| 4   | Interactive SwapDeck UI                          | Tinder-style swipe deck with gestures, animated feedback, and quick actions                                    | M2        | requirement |
| 5   | Trade Studio Negotiation Modal                   | Interactive offer builder with target selection, trade proposal, and eco calculation                           | M2        | requirement |
| 6   | Eco-Impact Live Dashboard                        | Real-time calculation of CO₂ (kg) and H₂O (Liters) saved per swap                                              | M2        | requirement |
| 7   | Peer Closet Showcase                             | Browse community members' closets, filter by aesthetic, size, location                                         | M2        | requirement |
| 8   | Super-App Tab Navigation                         | Modern web/mobile tab bar linking index, stylist, shop, swap, profile cleanly                                  | M3        | requirement |
| 9   | High-End Design & Micro-Animations               | Smooth transitions, backdrop blurs, glassmorphism, responsive cards, zero layout breaks                        | M3        | requirement |
| 10  | Dual-Track E2E Test Suite                        | 4-tier requirement test suite (Tiers 1-4) passing 100%                                                         | M_final   | requirement |
| 11  | Adversarial Coverage Hardening                   | Tier 5 white-box audit and zero-any compliance signoff                                                         | M_final   | requirement |

## Milestones

| #       | Name                                       | Scope                                                                                                                                   | Dependencies | Status |
| ------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| M1      | Core Quality, Data Model & Quality Scripts | Types (`src/types/swap.ts`), data (`src/data/swap-data.ts`), cleanup starter `as any`, quality check script (`scripts/check-no-any.js`) | none         | DONE   |
| M2      | OmniSwap Hub Standout Feature              | Build `src/components/swap/*` (SwapDeckCard, TradeStudioModal, ClosetHubView, EcoImpactBanner) and `src/app/swap.tsx` screen            | M1           | DONE   |
| M3      | Super-App Navigation & UI Polish           | Update `src/components/app-tabs.web.tsx`, integrate `/swap` tab, add micro-animations, glassmorphism styling                            | M2           | DONE   |
| M_final | E2E Test Verification & Hardening          | Run 4-tier E2E tests, pass zero-`any` check, pass `npx tsc --noEmit`, pass `teamwork_preview_auditor`                                   | M3           | DONE   |

## Code Layout

- `src/types/swap.ts` — Owned by M1
- `src/data/swap-data.ts` — Owned by M1
- `scripts/check-no-any.js` — Owned by M1
- `src/app/index.tsx` — Starter cleanup owned by M1
- `src/components/swap/SwapDeckCard.tsx` — Owned by M2
- `src/components/swap/TradeStudioModal.tsx` — Owned by M2
- `src/components/swap/ClosetHubView.tsx` — Owned by M2
- `src/components/swap/EcoImpactBanner.tsx` — Owned by M2
- `src/app/swap.tsx` — Owned by M2
- `src/components/app-tabs.web.tsx` — Owned by M3
- `src/app/_layout.tsx` — Owned by M3
- `tests/*` — Owned by E2E Testing Track

## Interface Contracts

### `src/types/swap.ts`

```typescript
export interface SwapItem {
  id: string;
  title: string;
  brand: string;
  category: 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Accessories';
  size: string;
  condition: 'Like New' | 'Excellent' | 'Good' | 'Upcycled';
  estimatedValue: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  imageUrl: string;
  ownerName: string;
  ownerAvatar: string;
  ownerLocation: string;
  aestheticTag: string;
  description: string;
}

export interface SwapTradeProposal {
  id: string;
  offeredItemId: string;
  requestedItemId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface UserSwapProfileStats {
  totalSwaps: number;
  totalCo2SavedKg: number;
  totalWaterSavedLiters: number;
  reputationScore: number;
}
```
