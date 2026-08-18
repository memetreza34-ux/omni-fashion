# Omni Fashion – Entwicklungsdokumentation

Diese Dokumentation ist die operative Ergänzung zu [`APP_ENTWICKLUNG_A_BIS_Z.md`](../APP_ENTWICKLUNG_A_BIS_Z.md) und wird zusammen mit dem Code gepflegt.

## Leitprinzip

Die Master-Roadmap beschreibt **was** Omni Fashion werden soll. Die Dateien unter `docs/` beschreiben **wie der aktuelle produktionsorientierte Stand konkret umgesetzt ist**.

Produktkern:

```text
OWN → STYLE → SWAP → BUY BETTER
```

Der private Wardrobe bleibt die Source of Truth. Kritische AI-, Marketplace-, Trade-, Moderations-, Push-, Feature-Flag- und Privacy-Mutationen laufen über Trusted Backend Grenzen.

## Dokumentationsstruktur

| Bereich | Pfad | Aktueller Stand |
|---|---|---|
| Governance / Roadmap | [`00-governance/`](./00-governance/) | ✅ aktiv |
| Produkt / MVP / Journeys | [`01-product/`](./01-product/) | ✅ definiert |
| Architektur | [`02-architecture/`](./02-architecture/) | ✅ Kern definiert |
| Design / Accessibility | [`03-design/`](./03-design/) | 🟡 Primitives + erste Migrationen |
| Auth | [`04-auth/`](./04-auth/) | 🟡 technischer Kern, Device-/Firebase-Validierung offen |
| Firebase Backend | [`05-backend/`](./05-backend/) | 🟡 Security-/Functions-Basis, reales Deployment offen |
| Cloud Wardrobe | [`06-wardrobe/`](./06-wardrobe/) | 🟡 Kern implementiert, Device-E2E offen |
| AI Kleidungsanalyse | [`07-ai/`](./07-ai/) | 🟡 Trusted Backend implementiert, reales Secret/Evals offen |
| Stylist | [`08-stylist/`](./08-stylist/) | ✅ technischer Kern |
| OmniSwap | [`09-omniswap/`](./09-omniswap/) | 🟡 End-to-End-Kern, reale Zwei-Nutzer-Tests offen |
| Notifications / Push | [`10-notifications/`](./10-notifications/) | 🟡 In-App fertig, native Push-Registrierung offen |
| Moderation | [`11-moderation/`](./11-moderation/) | 🟡 Backend + interne UI-Basis |
| Support / Recovery | [`12-support/`](./12-support/) | 🟡 Backend + read-only interne UI |
| Privacy / Account Lifecycle | [`13-privacy/`](./13-privacy/) | 🟡 technischer Lifecycle, Recht/E2E offen |
| Operations | [`14-operations/`](./14-operations/) | 🟡 Feature Flags + Rate Limits |
| Qualität | [`14-quality/`](./14-quality/) | 🟡 permanente CI-Gates, Device-E2E offen |
| Release / EAS | [`15-release/`](./15-release/) | 🟡 vorbereitet, echte Cloud-/Store-Konfiguration offen |

## Operations-Dokumente

- [`14-operations/FEATURE_FLAGS.md`](./14-operations/FEATURE_FLAGS.md) – Trusted Remote Flags, Kill-Switches und Rollback
- [`14-operations/RATE_LIMITS.md`](./14-operations/RATE_LIMITS.md) – serverseitige Abuse-/Cost-Grenzen

## Permanente Quality-Gates

Der aktuelle Arbeitsbranch prüft bei relevanten Änderungen:

1. TypeScript strict + Zero-any
2. echten Expo Router Production-Webbundle
3. Functions Typecheck + Build + Unit Tests
4. Firebase Auth/Firestore/Storage Emulator Security Tests

Der letzte vollständige Runtime-/Security-Checkpoint des Rate-Limit-Blocks war auf allen vier Gates grün.

## Arbeitsregel

Bei jedem größeren Block werden gemeinsam gepflegt:

1. Produktcode
2. Trusted Backend / Security soweit relevant
3. passende Detaildokumentation
4. [`ROADMAP_STATUS.md`](./00-governance/ROADMAP_STATUS.md)
5. automatisierte Quality-Gates

Ein Mock, Feature-Flag, Dokument oder UI-Prototyp wird nicht als produktionsfertige Funktion bezeichnet.

## Nächste große Strecke

Der intern ohne externe Konten umsetzbare Core ist weit fortgeschritten. Der nächste große Block benötigt reale Infrastruktur:

```text
Firebase Dev/Prod anlegen
→ Rules + Indizes + Functions + Secrets deployen
→ App Check aktivieren
→ EAS Projekt + echte App-Identifier
→ native Push-/Development-Build-Konfiguration
→ reale Android/iOS Zwei-Nutzer-E2E-Tests
→ Monitoring / Recht / Store-Vorbereitung
→ Release Candidate
```
