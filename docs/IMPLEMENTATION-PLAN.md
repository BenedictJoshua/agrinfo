# Primary Key Implementation Plan

## Phase 0 — Decisions and foundation

- [x] Review specification risks and define MVP boundaries.
- [ ] Confirm first geography, crop set, and data sources.
- [ ] Scaffold web, API, shared contracts, and database directories.
- [ ] Add environment examples, formatting, linting, and test commands.

## Phase 1 — Public information MVP

- [ ] Build landing page with accessible white/green design system.
- [ ] Implement location hierarchy browsing and search.
- [ ] Implement read-only crop, seed, and soil catalog APIs and views.
- [ ] Add provenance, verification, freshness, and unavailable-data components.
- [ ] Add English catalog and Tamil-ready localization structure.
- [ ] Create MySQL migrations, development seed data, and migration tests.

## Phase 2 — Accounts and contributions

- [ ] Implement registration, login, logout, recovery, sessions, and rate limits.
- [ ] Add farmer profiles and privacy/consent controls.
- [ ] Add farm plots with unit conversion and private geometry.
- [ ] Add submissions, moderation states, reviewer permissions, and audit events.
- [ ] Add soil-health records and historical comparisons.

## Phase 3 — External data

- [ ] Verify and document each provider's API, licensing, quotas, and freshness.
- [ ] Add weather adapter and cached observations/forecasts.
- [ ] Add market-price adapter with dated historical display.
- [ ] Add map and boundary adapters with attribution and privacy-safe rendering.

## Phase 4 — Decision support and administration

- [ ] Add transparent crop suitability rules with missing-input explanations.
- [ ] Add regional comparison dashboards.
- [ ] Add administrator data-quality and integration-status views.
- [ ] Add notifications and operational reporting.

## Phase 5 — Production readiness

- [ ] Complete security, privacy, accessibility, and performance testing.
- [ ] Configure backups, recovery drills, monitoring, and alerting.
- [ ] Document deployment, migrations, incident response, and data retention.
- [ ] Perform end-to-end testing against production-like services.

## Immediate implementation slice

The first code slice is a minimal React/Vite/TypeScript web foundation containing the public landing page and a location-aware explorer shell. It intentionally does not claim live agricultural data. API and MySQL work follows after the UI contract and initial geography/data-source decisions are confirmed.

