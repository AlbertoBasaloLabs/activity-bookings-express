## Implementation Plan for bug-api-dto-client-alignment.spec

- **Specification**: [bug-api-dto-client-alignment.spec.md](./bug-api-dto-client-alignment.spec.md)
- **PRD**: [FR1, FR2, FR4, FR6, TR3, TR4](../PRD.md)
- **Branch**: `fix/api-dto-client-alignment`

### Step 1: Establish Canonical API DTO Boundary
Define a single transport contract layer that mirrors `client/` DTOs without changing business rules.
- [x] Create API-facing DTO types (or mappers) aligned to `client/user.type.ts`, `client/userAccessToken.type.ts`, `client/activity.type.ts`, `client/booking.type.ts`, and `client/login.type.ts`
- [x] Decide and document JSON date strategy (ISO string payloads parsed as `Date` by client)
- [x] Define numeric ID normalization rules for all DTO responses (`id`, `userId`, `activityId`)
- [x] Keep internal domain entities unchanged where possible; isolate conversion at API boundary

### Step 2: Align Auth Contracts (`POST /users`, `POST /login`)
Ensure registration and login responses exactly match `UserAccessToken` with numeric user IDs.
- [x] Update auth/user response shaping to always return `user: { id:number, username, email, terms }`
- [x] Keep `accessToken` contract unchanged while guaranteeing response object shape parity
- [x] Verify request typing for login payload aligns with `client/login.type.ts`
- [x] Preserve current validation/error behavior (TR4) while adapting DTO output only

### Step 3: Align Activity Contracts (`GET/POST/PUT /activities`)
Return activity DTOs matching client expectations for all activity endpoints.
- [x] Add output mapping for activity payloads (`id:number`, `userId:number`, compatible `date` format)
- [x] Apply the same DTO shape for list, detail, create, and update responses
- [x] Ensure all `ActivityStatus` values remain supported (`draft`, `published`, `confirmed`, `sold-out`, `done`, `cancelled`)
- [x] Confirm no extra required fields are introduced in response payloads

### Step 4: Align Booking Contracts (`GET/POST /bookings`, `GET /bookings/:id`)
Match booking payload structure, especially nested payment object and status vocabulary.
- [x] Replace/extend booking response shape to match client `Booking` contract
- [x] Ensure booking IDs and foreign keys are numeric in responses
- [x] Provide nested `payment` object with `method`, `amount`, and `status`
- [x] Normalize payment values to client enums (`none|cash|creditCard|paypal` and `none|pending|paid|refunded`)
- [x] Keep business flow (capacity/payment/auth) unchanged while adapting transport shape

### Step 5: Implement Mapping Utilities and Route Integration
Centralize DTO conversion to avoid repeated ad hoc mapping in routes.
- [x] Add mapper utilities (e.g., domain-to-api DTO converters) under `src/` consistent with project style
- [x] Integrate mappers in `src/routes/auth.ts`, `src/routes/users.ts`, `src/routes/activities.ts`, and `src/routes/bookings.ts`
- [x] Ensure open security mode and secured mode return identical DTO shapes
- [x] Keep route/service layering intact (Routes → Services → Types)

### Step 6: Validate with Typecheck and Contract-Focused Tests
Verify runtime payloads match client expectations and no regressions are introduced.
- [ ] Add or update endpoint-level tests to assert response field names and primitive types for auth, activities, and bookings
- [ ] Add assertions for payment object shape and enum values in booking responses
- [x] Run `npm run typecheck`
- [x] Run relevant tests (`node --test` and/or existing workspace test command) and fix DTO-related failures
- [x] Record any known non-goal gaps explicitly in issue/plan notes

### Step 7: Documentation and Traceability
Keep spec and implementation traceability complete for future maintenance.
- [ ] Update the spec issue link once tracking issue exists
- [ ] Add short implementation notes in PR/issue describing mapping strategy and compatibility guarantees
- [ ] Reference changed endpoints and DTO contracts in handoff summary
