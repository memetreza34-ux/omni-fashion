# Omni Fashion

Omni Fashion wird auf diesem Branch vom High-End-Prototyp in einen produktionsorientierten Core überführt.

## Produktkern

```text
OWN → STYLE → SWAP → BUY BETTER
```

Der digitale Kleiderschrank ist die private Source of Truth. Darauf bauen Style-DNA, Outfit-Empfehlungen, OmniSwap und später echte Shop-/Partnerdaten auf.

## Aktueller technischer Stand

Bereits im Repo vorhanden:

- Firebase Auth mit Registrierung, Verifikation und Passwort-Reset
- Cloud Wardrobe mit Firestore + privatem Storage
- Trusted AI-Kleidungsanalyse mit strukturiertem Ergebnis
- StyleProfile + deterministischer Outfit Engine
- Saved Outfits + Feedback
- Trusted Wetterkontext
- echtes OmniSwap Listing-/Offer-/Trade-System
- Trust & Safety, Disputes und completed-Trade Reviews
- In-App Notifications
- Remote-Push-Backend-Grundlage
- Moderations-/Recovery-Backend + interne UI-Basis
- Privacy Export / Deletion Readiness / Account Deletion
- Remote Feature Flags / Kill-Switches
- serverseitige Rate Limits für kosten-/abuse-relevante Callables
- Designsystem-/Accessibility-Grundlage
- Performance-Query-Limits und Listen-Virtualisierung
- permanente TypeScript-/Functions-/Security-/Production-Bundle-CI-Gates
- EAS-/Release-/Rollback-Vorbereitung

## Noch nicht als Production fertig markieren

Es fehlen weiterhin reale externe Voraussetzungen und Device-Validierung:

- echte Firebase Dev-/Prod-Projekte und Deployments
- Gemini Secret im Dev-/Prod-Backend
- App Check
- echtes Expo/EAS-Projekt
- finale Android Package ID / iOS Bundle ID
- Signing/Credentials
- SDK-57-konforme native Push-Konfiguration
- reale Android-/iOS-Zwei-Nutzer-E2E-Tests
- Crash-/Analytics-/Cost-Monitoring mit realen Daten
- finale Privacy-/Retention-/Store-Angaben
- Store Release Candidate und kontrollierter Rollout

## Dokumentation

Die operative Dokumentation liegt unter [`docs/`](./docs/).

Wichtige Einstiege:

- [`APP_ENTWICKLUNG_A_BIS_Z.md`](./APP_ENTWICKLUNG_A_BIS_Z.md)
- [`docs/README.md`](./docs/README.md)
- [`docs/00-governance/ROADMAP_STATUS.md`](./docs/00-governance/ROADMAP_STATUS.md)
- [`docs/14-operations/FEATURE_FLAGS.md`](./docs/14-operations/FEATURE_FLAGS.md)
- [`docs/14-operations/RATE_LIMITS.md`](./docs/14-operations/RATE_LIMITS.md)

## Entwicklungsregel

Keine Mock-Funktion wird als echte Produktfunktion ausgegeben. Kritische AI-, Marketplace-, Trade-, Moderations-, Push-, Feature-Flag- und Privacy-Mutationen laufen über Trusted Backend Grenzen.

Der große Arbeits-PR bleibt Draft, bis reale Firebase-/EAS-/Device-/Store-Validierung abgeschlossen ist.
