# Original User Request

## Initial Request — 2026-08-07T14:02:09Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Deine finale Freigabe einholen → via `invoke_subagent` an das Team delegieren.

Die Omni-Fashion Super-App soll auf das nächste Level gehoben werden. Das Team soll die Konkurrenz analysieren, das beste Feature für den maximalen Markt-Vorteil eigenständig identifizieren und als High-End Prototyp in die App implementieren. Der Fokus liegt auf einem extrem hochwertigen Design ("Wow-Effekt") und exzellenter Code-Struktur.

Working directory: /Users/arman/.gemini/antigravity/scratch/omni-fashion
Integrity mode: development

## Requirements

### R1. Konkurrenzanalyse & Feature-Implementierung

Führe eine schnelle Analyse der Konkurrenz-Apps (Whering, Acloset, Cladwell) durch. Identifiziere ein herausragendes Feature, das den größten Markt-Vorteil bietet (z.B. Second-Hand Integration, Social Swapping, Tailor-Services). Implementiere dieses Feature in die bestehende App.

### R2. High-End UI/UX Design (Wow-Effekt)

Überarbeite und verfeinere das gesamte UI/UX Design der App. Die App muss sich extrem premium und flüssig anfühlen. Nutze moderne UI-Paradigmen, Mikro-Animationen und das bestehende NativeWind Setup (TailwindCSS). Dummy-Daten sind für die Präsentation erlaubt.

### R3. Code-Qualität & Architektur

Strukturiere den Code so, dass er für die spätere Produktion optimal vorbereitet ist. Nutze React-Best-Practices, striktes TypeScript und halte die modulare Architektur (Tabs, Components, Screens) sauber.

## Acceptance Criteria

### Funktionalität & Feature

- [ ] Ein neues, klares Hauptfeature (basierend auf der Konkurrenzanalyse) ist im UI integriert und visuell vollständig (inkl. Dummy-Daten) nutzbar.

### Design & UX

- [ ] Die App weist durchgängig Premium-Design-Muster auf (Schatten, Radien, Abstände, Farben sind harmonisch).
- [ ] Responsive Layouts funktionieren fehlerfrei (Web/iOS Simulator-fähig).

### Code-Qualität (Programmatic Verification)

- [ ] Das Projekt lässt sich ohne TypeScript-Fehler kompilieren (`npx tsc --noEmit` gibt Exit Code 0 zurück).
- [ ] Es werden keine `any`-Typen im neu geschriebenen Code verwendet.
