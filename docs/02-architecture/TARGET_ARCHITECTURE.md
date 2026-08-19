# Omni Fashion – Target Architecture

## Status

**Phase 1/2 Architekturentwurf.**

Diese Architektur ist speziell auf den aktuellen Omni-Fashion-Prototyp zugeschnitten und definiert, wie die heute getrennten Demo-Bereiche zu einem gemeinsamen Produkt werden.

---

# 1. Aktuelles Kernproblem

Der aktuelle Prototyp besitzt mehrere starke Oberflächen, aber die Datenflüsse sind getrennt:

```text
Wardrobe → AsyncStorage
Stylist → statische Outfits
Style-DNA → Zufallsprofil
Weather → Zufall
Shop → Mock-Produkte
OmniSwap → Mock-Dataset + lokaler State
```

Das Ziel ist nicht, diese Screens neu zu bauen. Das Ziel ist, sie an eine gemeinsame Domain- und Backend-Architektur anzuschließen.

---

# 2. Zielbild

```text
┌──────────────────────────────────────────────┐
│                 Expo App                     │
│                                              │
│  Auth  Wardrobe  Stylist  Swap  Profile     │
│    │      │        │       │      │          │
│    └──────┴────────┴───────┴──────┘          │
│                    │                         │
│              Feature Services                │
└────────────────────┬─────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
       ▼                           ▼
 Firebase Client APIs       Trusted Backend
 Auth / Firestore /         Functions / Cloud Run
 Storage                    │
       │                     ├─ AI Analysis
       │                     ├─ Trade Commands
       │                     ├─ Moderation
       │                     ├─ Notifications
       │                     └─ Cleanup / Jobs
       │                           │
       └─────────────┬─────────────┘
                     ▼
               Shared Data Model
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Wardrobe    Outfits    OmniSwap
          │          │          │
          └──────┬───┴──────────┘
                 ▼
           Style / Utility
```

---

# 3. Architekturprinzipien

1. **Wardrobe ist Source of Truth für eigene Kleidungsstücke.**
2. **Screens greifen nicht direkt beliebig auf Firebase zu.** Backendzugriff wird über Feature-/Service-Schichten gekapselt.
3. **Kritische Zustandsänderungen laufen über vertrauenswürdige Serverlogik.**
4. **Öffentliche Marketplace-Daten und private Wardrobe-Daten werden getrennt behandelt.**
5. **KI-Provider ist austauschbar.**
6. **Domain Types werden nicht pro Screen dupliziert.**
7. **Serverdaten, UI-State und persistente lokale Daten werden bewusst getrennt.**
8. **Feature Flags ermöglichen kontrollierte Einführung und Kill Switches.**
9. **Schema-Versionen ermöglichen Migrationen.**
10. **Jede Kernjourney ist testbar, ohne Mock-Produktlogik in Production.**

---

# 4. Ziel-Verzeichnisstruktur

Die vorhandene Struktur wird schrittweise migriert; kein Big-Bang-Rewrite.

```text
src/
├── app/                          # Expo Router Screens / Layouts
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── stylist.tsx
│   ├── swap.tsx
│   ├── shop.tsx
│   └── profile.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types.ts
│   ├── wardrobe/
│   ├── stylist/
│   ├── swap/
│   ├── profile/
│   └── shop/
│
├── services/
│   ├── firebase/
│   │   ├── app.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   ├── ai/
│   ├── weather/
│   ├── notifications/
│   ├── analytics/
│   └── feature-flags/
│
├── components/                  # nur wirklich shared UI
├── config/
├── schemas/
├── types/
├── hooks/
├── utils/
└── constants/
```

## Migration

Bestehende Components werden nicht sofort verschoben. Erst wenn ein Feature produktiv überarbeitet wird, wird sein Code in die Zielstruktur überführt.

---

# 5. Domain Model

## 5.1 User

```ts
interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  locale: string;
  country?: string;
  city?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
```

E-Mail bleibt primär im Auth-System und wird nur zusätzlich gespeichert, wenn ein konkreter Produktzweck besteht.

---

## 5.2 WardrobeItem

Zentrale Kleidungs-Domain:

```ts
interface WardrobeItem {
  id: string;
  ownerId: string;
  imageUrls: string[];
  name: string;
  category: string;
  subcategory?: string;
  colors: string[];
  pattern?: string;
  materials: string[];
  brand?: string;
  size?: string;
  seasons: string[];
  styleTags: string[];
  formality?: string;
  condition?: string;
  favorite: boolean;
  aiMetadata?: WardrobeAiMetadata;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
```

### Nicht in WardrobeItem

- fremder Owner-Name als duplizierte Wahrheit
- öffentliche Marketplace-Reputation
- Trade-Status
- Mock-Eco-Werte

---

## 5.3 StyleProfile

```ts
interface StyleProfile {
  userId: string;
  preferredStyles: string[];
  preferredColors: string[];
  avoidedColors: string[];
  fitPreferences: string[];
  favoriteBrands: string[];
  budgetRange?: {
    min?: number;
    max?: number;
    currency: string;
  };
  feedbackSignals: StyleFeedbackSummary;
  updatedAt: string;
  schemaVersion: number;
}
```

Style-DNA ist kein zufälliger Label-Generator, sondern eine zusammengefasste Sicht auf explizite Präferenzen und gelerntes Verhalten.

---

## 5.4 Outfit

```ts
interface Outfit {
  id: string;
  ownerId: string;
  itemIds: string[];
  occasion?: string;
  weatherContext?: WeatherSnapshot;
  score?: OutfitScore;
  explanation?: string;
  saved: boolean;
  createdAt: string;
  generatorVersion: string;
  schemaVersion: number;
}
```

Wichtig: nur IDs echter `WardrobeItem`s verwenden.

---

## 5.5 SwapListing

```ts
interface SwapListing {
  id: string;
  wardrobeItemId: string;
  ownerId: string;
  status: 'draft' | 'active' | 'paused' | 'reserved' | 'traded' | 'removed';
  publicSnapshot: {
    imageUrl: string;
    title: string;
    brand?: string;
    category: string;
    size?: string;
    condition: string;
  };
  approximateLocation?: string;
  description?: string;
  wantedCategories: string[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
```

### Warum `publicSnapshot`?

Marketplace-Feeds brauchen schnelle öffentliche Daten. Gleichzeitig darf der Feed nicht direkten Zugriff auf das private Wardrobe-Dokument benötigen.

Der Snapshot wird beim Erstellen/Aktualisieren kontrolliert erzeugt.

---

## 5.6 SwapOffer / Trade

Angebot und laufende Transaktion können zunächst als ein Modell starten oder bewusst getrennt werden. Empfohlen ist eine Trennung, sobald Workflow komplex wird.

### SwapOffer

```ts
interface SwapOffer {
  id: string;
  requesterId: string;
  listingOwnerId: string;
  requestedListingId: string;
  offeredWardrobeItemId: string;
  status: 'sent' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  createdAt: string;
  updatedAt: string;
}
```

### SwapTransaction

```ts
interface SwapTransaction {
  id: string;
  offerId: string;
  participantIds: [string, string];
  itemIds: [string, string];
  status:
    | 'arranging_exchange'
    | 'shipped'
    | 'meetup_confirmed'
    | 'received'
    | 'completed'
    | 'cancelled'
    | 'disputed';
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
```

---

# 6. Firestore Collection Strategy

Erster Zielentwurf:

```text
users/{uid}
styleProfiles/{uid}
wardrobeItems/{itemId}
outfits/{outfitId}
swapListings/{listingId}
swapOffers/{offerId}
swapTransactions/{transactionId}
reviews/{reviewId}
reports/{reportId}
blocks/{blockId}
notificationPreferences/{uid}
```

Je nach Query- und Security-Anforderungen können Subcollections später sinnvoll sein. Erst reale Queries und Rules festlegen, dann endgültig entscheiden.

---

# 7. Private vs Public Data

## Private

- vollständiger Wardrobe
- persönliche Notes
- Kaufpreis, wenn nicht bewusst geteilt
- exakte Adresse
- private Style-Präferenzen
- interne AI Metadata
- Push Tokens

## Public/Marketplace

- Listing Snapshot
- öffentlicher Display Name
- bewusst freigegebenes Profilbild
- Reputation Summary
- ungefähre Region
- öffentliche Reviews nach Policy

Private Daten dürfen nicht nur deshalb öffentlich werden, weil dieselbe Person ein Listing erstellt.

---

# 8. Firebase Client Responsibilities

Der Client darf direkt nutzen:

- Auth Login/Logout/Session
- Lesen eigener Wardrobe-Daten gemäß Rules
- nichtkritische eigene CRUD-Aktionen gemäß Rules
- öffentliche Listings lesen
- eigene UI Preferences speichern

Nicht jede Operation braucht einen Server-Endpunkt.

---

# 9. Trusted Backend Responsibilities

Kritische Commands werden serverseitig verarbeitet.

Geplante fachliche Commands:

```text
analyzeWardrobeImage
createSwapOffer
acceptSwapOffer
advanceSwapTransaction
completeSwapTransaction
submitReport
moderateListing
sendTransactionalNotification
deleteAccountData
```

Warum Commands statt blindem Client-Update?

Beispiel:

```text
Client setzt offer.status = accepted
```

ist gefährlich, wenn dadurch gleichzeitig zwei Items reserviert, konkurrierende Angebote geschlossen und Notifications erzeugt werden müssen.

Besser:

```text
acceptSwapOffer(offerId)
→ server prüft Rolle und aktuellen Zustand
→ Transaction
→ reserviert Items
→ erzeugt SwapTransaction
→ schließt konkurrierende Angebote
→ sendet Events
```

---

# 10. AI Architecture

## Wardrobe Analysis

```text
Mobile Client
→ Storage Upload
→ Backend analyzeWardrobeImage
→ AI Provider Adapter
→ structured output
→ schema validation
→ confidence processing
→ result to client
→ user confirms
→ WardrobeItem saved
```

### Provider Adapter

```ts
interface WardrobeVisionProvider {
  analyze(input: WardrobeVisionInput): Promise<WardrobeVisionResult>;
}
```

Damit kann der Anbieter später gewechselt werden.

### Versionen speichern

```text
provider
model
promptVersion
schemaVersion
latencyMs
```

Keine unnötigen Prompts oder sensiblen Rohdaten dauerhaft speichern.

---

# 11. Outfit Engine Architecture

Outfit-Generierung wird als Domain Engine behandelt, nicht als Chat-Antwort.

```text
Wardrobe
→ Eligibility Filter
→ Candidate Generator
→ Compatibility Engine
→ Preference Ranker
→ Weather Ranker
→ Diversity Rules
→ final candidates
→ optional AI explanation
```

### Vorteil

Wenn generative AI nicht verfügbar ist, kann die App trotzdem Outfits liefern.

---

# 12. Weather Service

Ein Adapter verhindert Vendor Lock-in:

```ts
interface WeatherService {
  getCurrentWeather(location: LocationInput): Promise<WeatherSnapshot>;
}
```

Regeln:

- GPS nur mit Erlaubnis
- manuelle Stadt als Alternative
- Cache
- Timeout
- Outfit Engine kann ohne Wetter weiterarbeiten

---

# 13. Notifications

Push ist ein Event-Ausgang, nicht direkt Teil von Screen-Logik.

```text
Swap Offer created
→ domain event
→ notification service
→ Push
```

Notification Preference prüfen, bevor optionale Pushs versendet werden.

Transaktionale Sicherheits-/Trade-Nachrichten werden getrennt von Marketing-Pushs behandelt.

---

# 14. Client State Ownership

## Lokaler UI-State

Beispiele:

- aktiver Tab
- geöffnetes Modal
- Swipe-Animation
- Formularentwurf

## Server State

Beispiele:

- Wardrobe Items
- Listings
- Offers
- User Profile
- Outfits

Server State darf nicht dauerhaft nur in Component-State leben.

## Persistenter lokaler State

Nur bewusst, z. B.:

- Theme
- lokalisierte Preferences
- nicht sensibles Draft-Caching

AsyncStorage ist nicht mehr die primäre Datenbank für Kernproduktdaten.

---

# 15. Error Model

Services sollen Fehler kategorisieren, nicht überall rohe Provider-Fehler anzeigen.

Beispiel:

```ts
type AppErrorCode =
  | 'AUTH_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'NETWORK_UNAVAILABLE'
  | 'UPLOAD_FAILED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'LISTING_NOT_AVAILABLE'
  | 'TRADE_CONFLICT'
  | 'RATE_LIMITED'
  | 'UNKNOWN';
```

UI übersetzt Fehlercode in lokalisierte, verständliche Meldung.

---

# 16. Environment Strategy

Mindestens:

```text
development
staging
production
```

Keine Production-Daten beim lokalen Entwickeln.

Konfiguration enthält unter anderem:

- Firebase project identifiers
- backend base URL / function environment
- analytics environment
- feature flags

Secrets bleiben serverseitig.

---

# 17. Feature Flags

Geplante Flags:

```text
aiWardrobeAnalysis
newOutfitRanker
omniSwap
smartShopping
styleDnaV2
```

Flag-System soll später Remote Config oder vergleichbare serverseitige Steuerung erlauben.

---

# 18. Migrationsstrategie

Wichtige Dokumente erhalten `schemaVersion`.

Migrationen können erfolgen über:

- read-time normalization für kleine Änderungen
- einmalige Admin-/Backend-Migration
- dual-read/dual-write für riskante Übergänge

Keine irreversible Migration ohne Backup-/Rollback-Überlegung.

---

# 19. Observability

Jeder Release trägt eine eindeutige Version.

Technische Metriken:

- crash-free sessions
- API error rate
- upload failure rate
- AI failure rate
- AI latency
- Firestore permission errors
- trade conflict rate
- push delivery issues

Produktmetriken bleiben davon getrennt.

---

# 20. Security Testing

Zusätzlich zu UI-Tests brauchen wir Emulator-/Rules-Tests, z. B.:

```text
User A reads own Wardrobe → allow
User B reads User A private Wardrobe → deny
User B edits User A Wardrobe → deny
Anonymous reads active public listing → according to policy
Requester accepts own offer → deny
Listing owner accepts valid offer → allow through trusted command
```

---

# 21. Kein Big-Bang-Rewrite

Umbau-Reihenfolge:

```text
1. Config / Environments
2. Firebase Basis
3. echte Auth
4. UserProfile
5. Wardrobe Domain + Cloud
6. Image Upload
7. AI Analysis
8. StyleProfile
9. Outfit Engine
10. OmniSwap auf Wardrobe umstellen
11. Trade Backend
12. Notifications / Moderation
```

Jeder Schritt soll die App weiterhin startbar lassen.

---

# 22. Erste technische Zielentscheidung

Die nächste Codephase beginnt **nicht** mit OmniSwap oder neuem Design.

Sie beginnt mit:

```text
Environment System
→ Firebase Initialization
→ typed Auth User
→ echte Auth
→ UserProfile
→ Security Rules
```

Erst danach wird `WardrobeContext` von lokalem AsyncStorage auf die neue Domain-/Service-Schicht migriert.

---

# Definition of Done dieser Architekturphase

- [x] Produktkern definiert
- [x] MVP Scope definiert
- [x] Kernjourneys definiert
- [x] Source of Truth festgelegt
- [x] Client-/Server-Grenze festgelegt
- [x] AI-Grenze festgelegt
- [x] Marketplace-Konsistenzprinzip festgelegt
- [x] Security/Privacy by Design festgelegt
- [x] Migration/Feature-Flag/Rollback-Prinzip festgelegt
- [ ] endgültige Firebase Collection-/Rules-Entscheidung implementieren
- [ ] konkrete Environment-Dateien implementieren
- [ ] Auth technisch migrieren
