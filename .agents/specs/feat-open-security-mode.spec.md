# Open Security Mode Specification

- **Reference**: [PRD](/PRD.md) FR1, FR8, TR2, TR8.
- **Issue**: [#1](https://github.com/AlbertoBasaloLabs/activity-bookings-express/issues/1)
- **Status**: Draft

## Problem Description

The API currently requires authentication for protected workflows, which adds friction during live workshops and demos where participants need immediate access. Teams need a controlled way to run the server without client authentication while keeping behavior deterministic for user-bound operations.

### User Stories

- As a **workshop facilitator**, I want to **start the server in an open mode** so that **participants can use the API without logging in first**.
- As a **workshop participant**, I want to **call protected endpoints without a token in open mode** so that **I can focus on API behavior instead of authentication setup**.
- As a **product owner**, I want **a deterministic impersonated identity in open mode** so that **booking and payment flows remain consistent across demos**.

## Solution Overview

### User/App interface

- The server provides two runtime security modes: secured mode and open mode.
- A startup configuration switch controls which mode is active.
- In open mode, endpoints that normally require authentication can be used without client tokens.
- In secured mode, authentication behavior remains unchanged.

### Model and logic

- The system resolves one acting identity for open mode: the first user in the users store.
- In open mode, protected business actions execute as this acting user.
- In secured mode, identity continues to come from client authentication.
- The mode decision is global for the running server instance.

### Persistence

- Open mode reuses existing user records and does not introduce new persisted entities.
- The impersonated user comes from the current users store ordering.
- If no user is available, open mode cannot provide an acting identity.

## Acceptance Criteria

- [ ] THE [System] SHALL support a runtime security mode with values secured and open.
- [ ] WHEN [the server starts without explicit security mode configuration] THE [System] SHALL run in secured mode.
- [ ] WHEN [the server runs in open mode] THE [System] SHALL allow requests to protected endpoints without authentication tokens.
- [ ] WHILE [the server runs in open mode] THE [System] SHALL use the first user in the users store as the acting identity for protected operations.
- [ ] WHEN [a protected operation is executed in open mode] THE [System] SHALL apply business rules using the acting identity from the first user.
- [ ] IF [the server runs in open mode and the users store is empty] THEN THE [System] SHALL reject startup with a clear configuration error.
- [ ] WHEN [the server runs in secured mode] THE [System] SHALL require valid authentication for protected endpoints.
- [ ] WHEN [a request to a protected endpoint is unauthenticated in secured mode] THE [System] SHALL return HTTP 401.
- [ ] WHERE [responses include user-linked data created from protected operations] THE [System] SHALL return data linked to the acting identity used for that operation.
