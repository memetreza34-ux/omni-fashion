# Omni Fashion – Design System & Accessibility Foundation

Status: **Grundlage implementiert, Migration der gesamten App noch offen**

## Ziel

Das Designsystem soll die bestehende Premium-Optik von Omni Fashion konsistent und zugänglich machen. Es ist **kein Redesign**.

Die technische Grundlage liegt unter:

```text
src/design-system/
  tokens.ts
  AppButton.tsx
  AppCard.tsx
  StatusBanner.tsx
```

## Semantic Tokens

`tokens.ts` enthält aktuell:

- Radien
- Spacing
- Mindesthöhen für Controls
- Content-Paddings
- semantische Farben
- Button-Varianten

Mindesthöhe eines normalen interaktiven Controls:

```text
48 px
```

Kompakte Controls dürfen nicht unter 44 px fallen.

## AppButton

Unterstützt:

- `primary`
- `secondary`
- `danger`
- `ghost`
- Loading
- Disabled
- Accessibility Label
- Accessibility Role `button`
- Accessibility State für `disabled` und `busy`
- Mindest-Touchhöhe

Kritische destructive Aktionen sollen nicht mehr jeweils eigene ad-hoc TouchableOpacity-Zustände erfinden.

## AppCard

Semantische Töne:

- default
- danger
- warning
- success
- brand

Die Komponente bündelt Card-Radius, Border und Flächenlogik.

## StatusBanner

Wird für nicht-triviale Zustände genutzt und besitzt `accessibilityRole="alert"`.

Töne:

- neutral
- danger
- warning
- success
- brand

## Bereits migriert

### Privacy / Account Lifecycle

- Export-Button
- Reauthentication-Button
- destructive Account-Delete-Button
- Success/Warning-Zustände
- Loading-State
- Passwort- und Löschbestätigungsfelder mit Accessibility Labels
- Back-Button mit Accessibility Role/Label

### Global Error Boundary

- irreführende Demo-Sprache entfernt
- Production zeigt keine Raw-Fehlerdetails
- Development zeigt Diagnose
- Provider-neutrale Telemetry-Anbindung
- zugänglicher Retry-Button
- Fehlerzustand als Alert

### Wardrobe

- Item-Karten haben Accessibility Labels
- Add-Control hat Busy/Disabled State
- Loading besitzt Progressbar-Semantik

### Activity Inbox

- Notification-Karten sind als interaktive Controls markiert
- unread State ist für Accessibility verfügbar
- Loading besitzt Progressbar-Semantik

## Noch zu migrieren

Priorität:

1. OmniSwap destructive/critical actions
2. Auth Forms
3. Stylist Save/Feedback controls
4. Profile questionnaire
5. Wardrobe ItemDetails modal
6. restante Utility-Buttons

## Accessibility Audit vor Release

Noch explizit prüfen:

- VoiceOver iOS
- TalkBack Android
- Dynamic Type / größere Schrift
- Farbkontraste in Light/Dark
- Fokusreihenfolge
- Keyboard/Web Navigation
- Form-Fehlertexte
- Modal Focus / Escape / Back
- Icon-only Controls
- Touch Targets
- reduzierte Bewegung

## Regel

Ein Screen gilt nicht als accessibility-ready, nur weil TypeScript kompiliert. Die finalen Device-/Screenreader-Tests gehören zum Release-Gate.
