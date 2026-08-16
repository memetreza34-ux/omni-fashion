# Omni Fashion – Entwicklungsdokumentation

Diese Dokumentation wird parallel zum Code gepflegt und ist die operative Ergänzung zu [`APP_ENTWICKLUNG_A_BIS_Z.md`](../APP_ENTWICKLUNG_A_BIS_Z.md).

## Prinzip

Die Master-Roadmap beschreibt **was** gebaut wird. Die Dateien hier beschreiben **wie Omni Fashion konkret gebaut wird**.

## Aktueller Stand

| Bereich | Dokument | Status |
|---|---|---|
| Engineering-Regeln | [`00-governance/ENGINEERING_RULES.md`](./00-governance/ENGINEERING_RULES.md) | ✅ definiert |
| Roadmap-Fortschritt | [`00-governance/ROADMAP_STATUS.md`](./00-governance/ROADMAP_STATUS.md) | ✅ aktiv |
| Produktfundament | [`01-product/PRODUCT_FOUNDATION.md`](./01-product/PRODUCT_FOUNDATION.md) | ✅ definiert |
| MVP | [`01-product/MVP_SCOPE.md`](./01-product/MVP_SCOPE.md) | ✅ definiert |
| Kernjourneys | [`01-product/USER_JOURNEYS.md`](./01-product/USER_JOURNEYS.md) | ✅ definiert |
| Zielarchitektur | [`02-architecture/TARGET_ARCHITECTURE.md`](./02-architecture/TARGET_ARCHITECTURE.md) | ✅ Entwurf |
| Designsystem | `03-design-system/` | 🔴 offen |
| Auth | [`04-auth/AUTH_IMPLEMENTATION.md`](./04-auth/AUTH_IMPLEMENTATION.md) | 🟡 Code + UI weit vorbereitet, echte Firebase-Validierung offen |
| Backend | [`05-backend/FIREBASE_SETUP.md`](./05-backend/FIREBASE_SETUP.md) | 🟡 Bootstrap + Security Rules vorhanden |
| Wardrobe | `06-wardrobe/` | 🔴 produktive Migration als nächster Kernblock |
| AI | `07-ai/` | 🔴 offen |
| Stylist | `08-stylist/` | 🔴 produktive Migration offen |
| OmniSwap | `09-omniswap/` | 🔴 produktive Migration offen |
| Shop | `10-shop/` | ⚪ MVP+ |
| Security/Privacy | `11-security-privacy/` | 🟡 Regeln/Prinzipien begonnen |
| Testing | `12-testing/` | 🟡 CI Quality Gate vorhanden, echte Suite offen |
| Release | `13-release/` | 🔴 offen |
| Operations | `14-operations/` | 🔴 offen |

## Arbeitsregel

Bei jedem größeren Schritt werden gemeinsam aktualisiert:

1. Code
2. passende Detaildokumentation
3. `ROADMAP_STATUS.md`
4. automatisierte Qualitätsprüfung

So soll verhindert werden, dass Dokumentation und tatsächlicher Repo-Stand wieder auseinanderlaufen.

## Nächste technische Strecke

```text
Auth/Firebase real validierbar machen
→ Rules Tests
→ Wardrobe Domain konsolidieren
→ Cloud Wardrobe
→ Storage Upload
→ AI Kleidungsanalyse
→ Outfit Engine
→ OmniSwap an echte Wardrobe anbinden
```
