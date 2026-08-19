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

| Bereich                     | Pfad                                       | Aktueller Stand                                             |
| --------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Governance / Roadmap        | [`00-governance/`](./00-governance/)       | ✅ aktiv                                                    |
| Produkt / MVP / Journeys    | [`01-product/`](./01-product/)             | ✅ definiert                                                |
| Architektur                 | [`02-architecture/`](./02-architecture/)   | ✅ Kern definiert                                           |
| Design / Accessibility      | [`03-design/`](./03-design/)               | 🟡 Kernflows migriert, Device-Audit offen                   |
| Auth                        | [`04-auth/`](./04-auth/)                   | 🟡 technischer Kern, Device-/Firebase-Validierung offen     |
| Firebase Backend            | [`05-backend/`](./05-backend/)             | 🟡 Security-/Functions-Basis, reales Deployment offen       |
| Cloud Wardrobe              | [`06-wardrobe/`](./06-wardrobe/)           | 🟡 Kern implementiert, Device-E2E offen                     |
| AI Kleidungsanalyse         | [`07-ai/`](./07-ai/)                       | 🟡 Trusted Backend implementiert, reales Secret/Evals offen |
| Stylist                     | [`08-stylist/`](./08-stylist/)             | ✅ technischer Kern                                         |
| OmniSwap                    | [`09-omniswap/`](./09-omniswap/)           | 🟡 End-to-End-Kern, reale Zwei-Nutzer-Tests offen           |
| Notifications / Push        | [`10-notifications/`](./10-notifications/) | 🟡 In-App fertig, native Push-Registrierung offen           |
| Moderation                  | [`11-moderation/`](./11-moderation/)       | 🟡 Backend + interne UI-Basis                               |
| Support / Recovery          | [`12-support/`](./12-support/)             | 🟡 Backend + read-only interne UI                           |
| Privacy / Account Lifecycle | [`13-privacy/`](./13-privacy/)             | 🟡 technischer Lifecycle, Recht/E2E offen                   |
| Operations                  | [`14-operations/`](./14-operations/)       | 🟡 Remote Flags + Rate Limits                               |
| Qualität                    | [`14-quality/`](./14-quality/)             | 🟡 CI vollständig, Device-E2E offen                         |
| Release / EAS               | [`15-release/`](./15-release/)             | 🟡 vorbereitet, echte Cloud-/Store-Konfiguration offen      |

## Kern-Dokumente

- [`03-design/ACCESSIBILITY.md`](./03-design/ACCESSIBILITY.md) – migrierte Kernflows und noch offene Device-Audits
- [`05-backend/APP_CHECK_STRATEGY.md`](./05-backend/APP_CHECK_STRATEGY.md) – native Attestation und kontrolliertes Enforcement
- [`14-operations/FEATURE_FLAGS.md`](./14-operations/FEATURE_FLAGS.md) – Trusted Remote Flags, Kill-Switches und Rollback
- [`14-operations/RATE_LIMITS.md`](./14-operations/RATE_LIMITS.md) – serverseitige Abuse-/Cost-Grenzen
- [`14-quality/DEPENDENCY_AUDIT.md`](./14-quality/DEPENDENCY_AUDIT.md) – aktuelle npm-Audit-Findings, Safe-Fix-Ergebnis und Upgrade-Regeln

## Permanente Quality-Gates

Der aktuelle Arbeitsbranch prüft bei relevanten Änderungen:

1. Expo-SDK-Abhängigkeitskompatibilität
2. ESLint
3. Prettier
4. TypeScript strict + Zero-any + Production Foundation
5. echten Expo Router Production-Webbundle
6. Functions Typecheck + Build + Unit Tests
7. Firebase Auth/Firestore/Storage Emulator Security Tests

Zusätzlich laufen getrennte Dependency-Audit- und Safe-Fix-Simulationsworkflows. Sie dürfen keinen inkompatiblen Major-/SDK-Downgrade als automatische Sicherheitsbehebung übernehmen.

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
→ App Check im echten Development Build validieren
→ EAS Projekt + echte App-Identifier
→ native Push-/Development-Build-Konfiguration
→ reale Android/iOS Zwei-Nutzer-E2E-Tests
→ VoiceOver/TalkBack/Dynamic-Type/Performance Device-Audits
→ Monitoring / Recht / Store-Vorbereitung
→ Release Candidate
```
