# Omni Fashion – Accessibility Status

**Stand:** 18. August 2026

## Grundsatz

Accessibility wird bei Omni Fashion nicht als späteres visuelles Polish behandelt. Kritische Produktaktionen müssen ihren Zustand auch semantisch vermitteln.

Automatisierte TypeScript-/Bundle-Checks bestätigen, dass die verwendeten React-Native-Accessibility-APIs technisch gültig sind. Sie ersetzen aber **keine** Tests mit VoiceOver, TalkBack, Dynamic Type und echten Geräten.

## Gemeinsame Primitives

Zentrale Interaktionen verwenden soweit möglich:

- `AppButton`
- `AppCard`
- `StatusBanner`

`AppButton` bildet insbesondere ab:

- Button-Rolle
- Disabled State
- Busy State
- Mindest-Controlhöhe
- Varianten für Primary / Secondary / Danger / Ghost

## Migrierte Kernflows

### Auth

- Login
- Registrierung
- Passwort Reset
- E-Mail-Verifikation
- Verification Resend Cooldown
- beschriftete Eingabefelder
- Busy-/Disabled-Zustände
- semantische Fehler-/Erfolgsmeldungen

### Privacy / Account Lifecycle

- Datenexport
- Re-Authentication
- Löschbestätigung
- destruktive Account-Löschung
- Status-/Fehlerzustände

### Wardrobe

- virtualisiertes Wardrobe Grid
- Add-Control
- Item-Auswahl
- ItemDetailsModal als Modal-Kontext
- Name/Farbe/Marke/Größe/Material beschriftet
- Kategorie/Saison/Zustand als Radio-Gruppen
- AI-Analyse als Progress-/Retry-Zustand
- **Kleidungsstück-Löschung besitzt explizite destruktive Bestätigung**

### Style-DNA / Profil

- Style-/Farb-/Fit-Chips mit Checked State
- Style-Achsen als Radio-Gruppen
- Logout
- Datenschutz-Navigation
- Wardrobe Refresh
- Edit / Save / Cancel

### Stylist

- Anlass als Radio-Gruppe
- Saison als Radio-Gruppe
- Wetter-Stadtfeld beschriftet
- Wetter laden / manuell zurücksetzen
- Outfit speichern
- nächste Empfehlung
- gespeicherte Outfits löschen
- Outfit-Feedback mit Checked State
- Outfit-Bilder und Match-Score beschriftet

### OmniSwap

Der komplette sichtbare Lifecycle wurde migriert:

```text
Listing
→ Offer
→ Trade
→ Dispute
→ Review
```

Abgedeckt sind unter anderem:

- Marketplace Tabs mit Selected State
- Listing Actions
- Listing-Erstellung
- Wardrobe-Auswahl als Radio State
- Versand/Übergabe als Checkbox State
- Offer-Auswahl und Offer Actions
- Melden / Blockieren
- Dispute-Gründe
- Trade-Modus
- Versand-/Empfangsbestätigung
- Finalization Progress / Retry
- Review-Rating als Radio-Gruppe
- Review-Kommentar
- Busy-/Disabled-Zustände

### Aktivität

- virtualisierte Liste
- Loading State
- Notification-Interaktion
- Fehlerzustände

## Automatisch bestätigter Checkpoint

Der kombinierte Kern-UI-Head `00f2a385a331e075c5c104fcb6f9b74006dcc4f2` bestand vollständig:

1. TypeScript strict + Zero-any
2. Expo Router Production-Webbundle
3. Functions Typecheck + Build + Unit Tests
4. Firebase Auth/Firestore/Storage Emulator Security Tests

Damit ist die Code-/Bundle-Seite bestätigt. Es ist **kein Ersatz für Device Accessibility Testing**.

## Noch offen vor Production

### Physische Geräte

- [ ] iOS VoiceOver End-to-End
- [ ] Android TalkBack End-to-End
- [ ] Fokus-Reihenfolge in allen Modals
- [ ] Fokus-Rückgabe nach Modal Close
- [ ] Hardware-/Software-Back-Verhalten

### Text / Skalierung

- [ ] Dynamic Type / große Schriftgrößen auf iOS
- [ ] große Systemschrift auf Android
- [ ] Text-Clipping in Tabs, Chips und Karten
- [ ] Layout bei sehr langen deutschen Strings

### Visuell

- [ ] WCAG-orientierter Kontrast-Audit der tatsächlichen Light-/Dark-Theme-Farben
- [ ] Disabled-/Focus-/Selected-Zustände visuell prüfen
- [ ] ausschließlich farbbasierte Statusinformationen ausschließen

### Web / Keyboard

- [ ] Keyboard-Only Navigation
- [ ] sichtbare Focus States
- [ ] sinnvolle Tab-Reihenfolge
- [ ] Form Submit / Escape / Modal Focus Trap im Web prüfen

### Motion

- [ ] Reduced-Motion-Verhalten für Splash/Animationen
- [ ] keine kritische Information nur über Animation vermitteln

## Release-Regel

Accessibility gilt erst als Production-validiert, wenn die offenen Device-/Dynamic-Type-/Kontrast-/Focus-Prüfungen mit dem Release Candidate durchgeführt und Blocker behoben wurden.

Ein grüner Typecheck oder Webbundle allein darf den Status nicht auf „vollständig barrierefrei“ setzen.
