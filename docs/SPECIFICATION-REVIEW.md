# Primary Key Specification Review

## Summary

The specification is a strong product vision, but it is too broad to implement safely as one first release. The highest risks are data trust, privacy of farm locations, external-data availability, and the lack of defined operational decisions. The implementation should begin with a small, auditable public information slice and add authenticated contributions only after the data model and authorization rules are tested.

## Gaps and risks

| Area | Gap or risk | Required decision or control |
|---|---|---|
| Scope | The requested system includes a public portal, farmer workflows, review operations, administration, maps, weather, market prices, recommendations, multilingual UX, and soil history. | Define an MVP boundary. Phase 1 should cover public location browsing, crops, seeds, soils, and provenance-aware empty states. |
| Product decisions | User journeys, acceptance criteria, supported locations, and the first supported crops are not specified. | Establish measurable acceptance criteria and seed a deliberately small, documented dataset. |
| Geography | India has multiple administrative hierarchies and inconsistent names/transliterations. | Store stable source identifiers, hierarchy type, parent references, canonical names, local names, and source metadata. Never use display names as keys. |
| Privacy | Precise farm boundaries and coordinates are sensitive, but public/private behavior is not fully defined. | Model visibility and consent separately from ownership. Default farm geometry to private, minimize precision in public views, and enforce authorization server-side. |
| Data provenance | Verified, observed, forecast, estimated, and imported data are mentioned but not represented as a common contract. | Use a shared provenance model: source, observed/issued time, retrieval time, verification status, method, license, and freshness. |
| External services | IMD, Bhuvan, Soil Health Card, market, geocoding, and map services may require credentials, have rate limits, or lack stable public APIs. | Treat integrations as adapters with explicit availability states. Do not block core browsing on live services or present stale data as live. |
| Recommendations | Crop suitability can be mistaken for a guarantee or fertilizer prescription. | Start with transparent rules and explanations, return missing inputs, and prohibit unsupported agronomic prescriptions. |
| Authentication | Password reset, sessions/tokens, MFA, account recovery, and abuse controls are not chosen. | Decide cookie-session versus token architecture, email/SMS provider, password hashing parameters, rate limits, and recovery policy before implementation. |
| Roles | Reviewer and administrator responsibilities overlap in places, and moderation escalation is unspecified. | Define permission capabilities, review states, correction workflow, audit requirements, and separation of duties. |
| Uploads | Media and soil reports are required but file retention, malware scanning, storage, and redaction are unspecified. | Delay uploads until storage, validation, scanning, retention, and access controls are defined. |
| MySQL geospatial design | Geometry types, SRID, spatial indexes, migration tooling, and coordinate validation are not specified. | Use a documented coordinate reference system, validate ranges, and keep geometry access behind a privacy-aware service. |
| Localization | English and Tamil are required but translations, fallback behavior, names, dates, units, and transliteration rules are not defined. | Keep message catalogs separate, define locale fallback, and localize units/dates without translating stored canonical values. |
| Accessibility | General accessibility goals lack a target standard and test plan. | Target WCAG 2.2 AA for core journeys and include keyboard, contrast, labels, focus, reduced-motion, and screen-reader checks. |
| Performance | “Low-end devices” and “slower internet” are not measurable. | Set budgets for initial JS, images, API latency, and list sizes; use pagination and progressive loading. |
| Operations | Backups, recovery objectives, monitoring, alerting, migrations, and deployment environments are not specified. | Define RPO/RTO, structured logs, health checks, migration rollback policy, and environment separation before production. |
| Compliance | Privacy notice, consent withdrawal, retention, deletion/export, and grievance handling are absent. | Obtain a legal/privacy review for the deployment context and implement data lifecycle controls before collecting personal or farm data. |

## Recommended first release

1. Public landing page and location explorer.
2. Read-only, provenance-aware crop, seed, and soil records.
3. English/Tamil message catalog structure, with English content first and Tamil-ready keys.
4. Responsive accessible UI and explicit unavailable-data states.
5. MySQL schema migrations and seed data for a small, documented region.
6. Backend API contracts with validation and consistent errors.
7. Automated tests for location filtering, provenance display, and authorization boundaries.

Defer authenticated farm geometry, file uploads, live weather and market integrations, recommendations, and administrator workflows until their data and security decisions are approved.

