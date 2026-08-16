# Omni Fashion

Omni Fashion ist eine Expo-/React-Native-Super-App rund um einen intelligenten digitalen Kleiderschrank. Ein gemeinsamer Wardrobe-Datensatz soll langfristig den KI-Stylisten, OmniSwap und intelligente Kaufempfehlungen antreiben.

> **Projektstatus:** Übergang vom High-End-Prototyp zur produktionsreifen App.
>
> **Wichtig:** Eine UI oder Demo gilt ab jetzt nicht als fertiges Feature, solange echte Daten, Fehlerfälle, Sicherheit und Tests fehlen.

## Produktkern

```text
Nutzer
  ↓
Style-Profil
  ↓
Digitaler Kleiderschrank
  ↓
KI-/Regel-Engine
  ↓
Outfit-Empfehlungen
  ↓
┌──────────────────┬──────────────────┐
│ OmniSwap         │ Smart Shopping   │
│ Kleidung tauschen│ Lücken ergänzen  │
└──────────────────┴──────────────────┘
  ↓
Kleiderschrank und Nutzerprofil werden besser
```

Der zentrale Produktgrundsatz lautet:

> **Ein Kleidungsstück, ein Datenmodell, viele Funktionen.**

Stylist, OmniSwap, Profil und Smart Shopping dürfen keine voneinander getrennten Mock-Welten bleiben.

## Aktueller Stand

Bereits vorhanden sind unter anderem:

- Expo + React Native + Expo Router
- TypeScript
- NativeWind
- digitaler Kleiderschrank als UI und lokaler Prototyp
- Kamera-/Galerie-Auswahl
- Stylist-Oberfläche
- Style-DNA-Oberfläche
- Shop / Smart Investment Advisor UI
- OmniSwap Swipe Deck
- Trade Studio
- Peer Closets
- responsive Web-/Mobile-Navigation

Noch nicht produktionsreif sind unter anderem:

- echte Authentifizierung
- produktives Firebase-Backend
- Cloud-Wardrobe
- echte KI-Kleidungsanalyse
- echter Outfit-Algorithmus auf Nutzerdaten
- echtes Wetter
- persistenter OmniSwap-Marktplatz
- Trust & Safety / Moderation
- Push Notifications
- Security Rules
- echte E2E-Tests
- Analytics / Crash Reporting
- Store-/Release-Konfiguration

## Dokumentation

Die zentrale A-bis-Z-Roadmap befindet sich hier:

- [`APP_ENTWICKLUNG_A_BIS_Z.md`](./APP_ENTWICKLUNG_A_BIS_Z.md)

Die konkrete Entwicklungsdokumentation wird schrittweise unter `docs/` aufgebaut:

```text
docs/
├── 00-governance/
│   └── ENGINEERING_RULES.md
├── 01-product/
│   ├── PRODUCT_FOUNDATION.md
│   ├── MVP_SCOPE.md
│   └── USER_JOURNEYS.md
├── 02-architecture/
├── 03-design-system/
├── 04-auth/
├── 05-backend/
├── 06-wardrobe/
├── 07-ai/
├── 08-stylist/
├── 09-omniswap/
├── 10-shop/
├── 11-security-privacy/
├── 12-testing/
├── 13-release/
└── 14-operations/
```

Die Master-Roadmap sagt **was und in welcher Reihenfolge** gebaut wird. Die Detaildokumente sagen **wie, in welchen Dateien, mit welchen Datenmodellen, Tests und Abnahmekriterien** es umgesetzt wird.

## Entwicklungsmodus ab jetzt

Wir arbeiten phasenweise:

```text
Produkt festziehen
→ Architektur festlegen
→ Fundament bauen
→ Kernprodukt real machen
→ OmniSwap real machen
→ Monetarisierung
→ Produktionsreife
→ Store Release
→ Betrieb
```

Für jedes Feature gilt dieselbe Definition:

```text
Plan
→ Datenmodell
→ UI/UX
→ echte Logik
→ Loading / Empty / Error States
→ Security / Privacy
→ Tests
→ Telemetrie
→ Dokumentation
→ Definition of Done
```

## Lokale Entwicklung

```bash
npm install
npx expo start
```

Zusätzliche Qualitätsbefehle laut `package.json`:

```bash
npm run lint
npm run check-no-any
npm run verify:quality
```

Vor technischen Änderungen müssen die für dieses Repo geltenden Expo-SDK-57-Dokumente berücksichtigt werden. Siehe auch `AGENTS.md`.

## Wichtige Regeln

1. Keine echten Secrets committen.
2. Keine neue Mock-Funktion als produktionsfertig markieren.
3. `WardrobeItem` wird zur gemeinsamen Quelle für Stylist, Swap und Shopping.
4. Sensible Aktionen erhalten serverseitige Validierung bzw. Security Rules.
5. KI-API-Keys gehören nie in die Client-App.
6. Deutsch/Englisch nicht unkontrolliert in Components mischen; Lokalisierung wird zentralisiert.
7. Neue Features dürfen das Kernprodukt nicht verzögern.
8. Release erst, wenn die Definition of Done in der Master-Roadmap erfüllt ist.

## Aktuelle Arbeitsphase

**Phase 0–1: Produktfundament, MVP und User Journeys.**

Danach folgt die technische Zielarchitektur und anschließend das echte Fundament aus Umgebungen, Backend, Auth und Security.
