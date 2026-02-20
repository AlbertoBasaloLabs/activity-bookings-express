# ActivityBookings

Backend API for workshop activity bookings, built with Express + TypeScript.

## What it does

- User registration and login with JWT
- Activity lifecycle management (`draft` → `published` → `confirmed` → `done/cancelled`)
- Booking creation with capacity validation (no overbooking)
- Mock payment processing on booking creation
- JSON file persistence in `db/`

## Quickstart for developers

```bash
# Install dependencies
npm install

# Development (secured mode by default)
npm run dev

# Development in open mode (no auth required on protected routes)
npm run dev:open

# Type check
npm run typecheck

# Run tests
npm test

# Build and run production
npm run build
npm run start
```

Server default URL: `http://localhost:3000` (override with `PORT`).

## Security modes

- **Secured mode** (`npm run dev`): protected endpoints require `Authorization: Bearer <token>`.
- **Open mode** (`npm run dev:open`): protected endpoints bypass client auth and impersonate the first user from `db/users.json`.
- If `db/users.json` is empty, open mode fails at startup.

Manual env option (equivalent to `dev:open`):

```bash
SECURITY_MODE=open npm run dev
```

## Main API endpoints

- `GET /health`
- `POST /users`
- `POST /login`
- `GET|POST|PUT|DELETE /activities`
- `PATCH /activities/:id/status`
- `GET|POST /bookings`
- `GET /bookings/:id`

See detailed behavior and acceptance criteria in [specs/](specs/).

## API DTO compatibility

- API responses are aligned with DTO contracts in `client/`.
- Resource ids in API payloads are numeric (`id`, `userId`, `activityId`).
- Internal persisted ids remain string-based (`resource-<n>`) and are mapped at the HTTP boundary.
- Booking responses include nested `payment` shape:
  - `method`: `none | cash | creditCard | paypal`
  - `status`: `none | pending | paid | refunded`
- Date fields are emitted as ISO strings suitable for client-side `Date` parsing.


---

- [Repository at GitHub](https://github.com/AlbertoBasaloLabs/activity-bookings-express)
- Default branch: `master`

- **Author**: [Alberto Basalo](https://albertobasalo.dev)
- **Ai Code Academy en Español**: [AI code Academy](https://aicode.academy)
- **Socials**:
  - [X](https://x.com/albertobasalo)
  - [LinkedIn](https://www.linkedin.com/in/albertobasalo/)
  - [GitHub](https://github.com/albertobasalo)
