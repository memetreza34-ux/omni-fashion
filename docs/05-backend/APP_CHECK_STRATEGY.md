# Omni Fashion – App Check Strategie

## Entscheidung

App Check wird **nicht** als web-only Schutz in den aktuellen universellen Firebase-JS-SDK-Pfad eingebaut und anschließend als Mobile-Schutz bezeichnet.

Der aktuelle Omni-Fashion-Core verwendet die Firebase JavaScript SDK für Auth, Firestore, Storage und Functions auf Web und React Native. Für echte native App-Attestation sind dagegen die nativen Plattformanbieter relevant:

- Android: Play Integrity
- Apple: App Attest / DeviceCheck
- Web: reCAPTCHA Enterprise

Deshalb bleibt App-Check-Enforcement bis zum realen EAS-/Device-Spike bewusst aus.

## Warum nicht jetzt einfach reCAPTCHA aktivieren?

reCAPTCHA Enterprise ist der Web-App-Check-Pfad. Omni Fashion ist primär eine native Android-/iOS-App. Ein Web-Provider darf nicht als Ersatz für native Attestation behandelt werden.

Außerdem darf Enforcement erst aktiviert werden, nachdem echte legitime Clients App-Check-Tokens senden und die Request-Metriken überprüft wurden. Sonst würden reale Nutzerzugriffe blockiert.

## Zielarchitektur

### Web

Web kann weiterhin die Firebase JavaScript SDK verwenden und später reCAPTCHA Enterprise als App-Check-Provider erhalten.

### Android / iOS

Für native App-Attestation wird nach vorhandenem EAS-Projekt und finalen App-Identifiern ein echter Development-Build-Spike durchgeführt.

Bevorzugte Reihenfolge:

1. `expo-dev-client` SDK-57-konform installieren.
2. finale Android Package ID und iOS Bundle ID konfigurieren.
3. native Firebase-App-Registrierungen anlegen.
4. Play Integrity für Android registrieren.
5. App Attest/DeviceCheck für iOS registrieren.
6. native App-Check-Integration in einem Development Build testen.
7. prüfen, wie die bestehende Firebase-Service-Schicht auf Native und Web getrennt werden muss.
8. erst nach erfolgreicher Token-Übertragung und Request-Metriken Enforcement aktivieren.

## Migrationsregel

Es gibt zwei denkbare Native-Pfade. Keiner wird ohne Device-Test als entschieden implementiert.

### Pfad A – Native Firebase Adapter

Native Android-/iOS-Service-Adapter verwenden eine native Firebase-Integration für App Check und die benötigten Firebase-Dienste; Web behält die Firebase JS SDK.

Vorteil:

- native Attestation folgt der Plattformarchitektur.

Nachteil:

- die bestehende universelle Firebase-Service-Schicht muss kontrolliert abstrahiert werden.

### Pfad B – validierter Custom-Provider-Bridge

Ein Custom App Check Provider für die JavaScript SDK wäre nur zulässig, wenn ein realer Device-Spike die native Attestation und Token-Weitergabe zuverlässig demonstriert.

Dieser Pfad wird **nicht** aufgrund theoretischer Kompatibilität vorimplementiert.

## Backend Enforcement

Cloud Functions Callable Functions unterstützen serverseitiges App-Check-Enforcement. Dieses wird noch nicht eingeschaltet.

Vorgehen:

1. Client-Attestation auf echten Builds funktioniert.
2. App-Check-Metriken zeigen legitime Requests mit gültigem Token.
3. Enforcement zuerst im Dev-Projekt aktivieren.
4. Auth, Firestore, Storage und Callables End-to-End testen.
5. Preview/Internal Testing validieren.
6. erst danach Production Enforcement aktivieren.

Replay-/Token-Consumption wird nur für niedrigvolumige, besonders kritische oder teure Callables geprüft, weil zusätzliche Attestation/Netzwerkaufrufe Performance und Provider-Quota beeinflussen können.

## Bereits vorhandene Schutzschichten

Bis App Check real aktiv ist, verlassen wir uns nicht auf einen einzigen Schutz:

- Firebase Auth
- serverseitige Ownership-/Participant-Prüfungen
- Default-Deny Firestore/Storage Rules
- Trusted Backend für kritische Mutationen
- server-only Moderation-/Push-/RuntimeConfig-/RateLimit-Daten
- transaktionale Rate Limits
- Feature-Flag Kill-Switches
- Idempotenz/Claims für AI, Trade und Push
- Emulator-Security-Tests

## Definition of Done für App Check

App Check gilt erst als umgesetzt, wenn:

- [ ] echtes Firebase Dev-Projekt existiert
- [ ] echte Android/iOS App-Registrierungen existieren
- [ ] EAS Development Build existiert
- [ ] Android Play Integrity Token auf physischem Gerät validiert
- [ ] iOS App Attest/DeviceCheck Token auf physischem Gerät validiert
- [ ] Web reCAPTCHA Enterprise separat validiert, falls Web öffentlich angeboten wird
- [ ] Firestore/Storage/Callable Requests senden App-Check-Token
- [ ] legitime/ungültige Requests in Dev getestet
- [ ] Monitoring vor Enforcement geprüft
- [ ] Dev Enforcement aktiviert und E2E grün
- [ ] Preview/Internal Testing grün
- [ ] Production Enforcement kontrolliert aktiviert

Vorher bleibt Roadmap-Status **offen**.
