# Primary Key Architecture

## Principles

- Public agricultural facts are readable without an account.
- Private farm data is deny-by-default and never protected only by frontend visibility.
- Every changing or imported record carries provenance and verification metadata.
- External services are replaceable adapters and may be unavailable.
- A missing value is represented as missing; the system never fabricates agricultural data.
- Canonical stored values remain language-neutral; presentation is localized.

## Repository layout

```text
apps/
  web/                 React + Vite + TypeScript frontend
  api/                 Node.js + Express + TypeScript API
packages/
  contracts/           Shared request/response and domain types
  config/              Shared runtime configuration helpers
database/
  migrations/          Ordered MySQL migrations
  seeds/               Small, attributed development dataset
docs/
  SPECIFICATION-REVIEW.md
  ARCHITECTURE.md
  IMPLEMENTATION-PLAN.md
```

## Frontend

The web app uses route-level feature modules and accessible, reusable components. The first public routes are:

- `/` landing page
- `/explore` location and information explorer
- `/crops`, `/seeds`, `/soils` read-only catalog views

The UI has explicit loading, empty, unavailable, and error states. API access is isolated in typed clients rather than embedded in components. A locale provider selects message catalogs and falls back to English.

## API

Express is organized into:

- `routes`: HTTP routing and status codes
- `controllers`: request/response translation
- `services`: domain behavior and authorization
- `repositories`: parameterized MySQL access
- `integrations`: weather, maps, market, and official data adapters
- `middleware`: validation, authentication, authorization, errors, request IDs

Responses use a consistent envelope:

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0 },
  "error": null
}
```

Errors use stable codes, human-readable messages, and a request ID without exposing stack traces or secrets.

## Database

MySQL is the source of truth. Core entities are users, roles, locations, crops, seeds, soil types, provenance sources, observations, farm plots, consent records, submissions, reviews, and audit events. Many-to-many relationships use explicit join tables. Public catalogs are separated conceptually from user-owned records through ownership and visibility fields.

All migrations are forward-only and tested against a disposable database. Spatial columns use a documented SRID and are never serialized to public responses without a visibility check.

## Security and privacy

- Passwords use Argon2id or bcrypt with production parameters.
- Authentication uses secure, HTTP-only, same-site cookies unless an approved client requirement requires tokens.
- Authorization is capability-based and evaluated in the API service layer.
- Validation is applied at request boundaries and database constraints.
- Rate limits apply to login, reset, submissions, and administrative actions.
- Farm coordinates and boundaries default to private.
- Audit events record sensitive changes without storing unnecessary personal data.
- Secrets are environment variables and are never bundled into the frontend.

## Data quality

Every imported or submitted record should identify source, collection/observation time, retrieval time, verification state, and license/usage constraints where applicable. Integrations report `available`, `degraded`, or `unavailable`; UI labels always expose the relevant date and source.

## Testing

- Frontend: component and accessibility tests for public journeys.
- API: schema, validation, service, and authorization tests.
- Database: migration, foreign-key, uniqueness, and privacy-fixture tests.
- Integration: mocked external adapter success, stale data, rate limit, and failure cases.
- End-to-end: public explore flow and private farm authorization flow once those features exist.

