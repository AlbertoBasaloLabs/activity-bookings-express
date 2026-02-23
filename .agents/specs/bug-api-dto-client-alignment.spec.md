# API DTO Client Alignment Specification

- **Reference**: [PRD](/PRD.md) FR1, FR2, FR4, FR6, TR3, TR4.
- **Issue**: TBD
- **Status**: Draft

## Problem Description

The API DTO contracts currently diverge from the client contract definitions in `client/`, causing type mismatches at integration time. The main inconsistencies include identifier types, date field shapes, booking payload structure, and payment representation. This creates avoidable mapping logic in clients, weakens type safety, and increases integration defects.

### User Stories

- As a **frontend developer**, I want **API payloads to match client DTO contracts exactly** so that **I can use shared types without custom adapters**.
- As an **API consumer**, I want **consistent field names and primitive types across all endpoints** so that **requests and responses are predictable**.
- As a **product team**, we want **a single canonical API contract** so that **new features do not reintroduce DTO drift**.

## Solution Overview

### User/App interface

Define and enforce API contracts that match the DTOs in `client/` for authentication, activities, and bookings.

#### Contract baseline

- Client DTO source of truth:
  - `client/user.type.ts`
  - `client/userAccessToken.type.ts`
  - `client/activity.type.ts`
  - `client/booking.type.ts`
  - `client/login.type.ts`

#### DTO alignment scope

- **Auth payloads** must conform to `UserAccessToken` and `Login`.
- **Activity payloads** must conform to `Activity` and `ActivityStatus`.
- **Booking payloads** must conform to `Booking`, including nested `payment` object.
- **ID fields** must be numeric in all API request/response DTOs where client types define `number`.
- **Date fields** must be JSON values that the client can deserialize into `Date` without ambiguous parsing.
- **No extra required fields** may be returned in DTO responses beyond the client contract for the same resource.

### Model and logic

- The API contract is treated as an explicit compatibility boundary with the client DTOs.
- Route-level request/response validation must use the aligned DTO definitions as acceptance boundary.
- Existing business rules (auth, lifecycle, capacity, payment outcomes, authorization) remain unchanged; only transport contract compatibility is addressed.
- Error response format remains governed by TR4 and is out of scope for DTO entity shape alignment except where endpoint request typing changes require validation updates.

### Persistence

- Persistence schema is not part of this change.
- Internal entities may differ from external DTOs, as long as API contracts returned to clients strictly match client DTO definitions.

## Acceptance Criteria

- [ ] THE [System] SHALL define the client DTO files in `client/` as the canonical contract for API transport payload compatibility.
- [ ] WHEN [a client calls `POST /users` with valid registration data] THE [System] SHALL return HTTP 201 with a body matching `UserAccessToken` (`user` + `accessToken`) and `user.id` as `number`.
- [ ] WHEN [a client calls `POST /login` with valid credentials] THE [System] SHALL return HTTP 200 with a body matching `UserAccessToken` and `user` matching `User`.
- [ ] WHEN [a client calls `GET /activities`] THE [System] SHALL return HTTP 200 with an array of DTOs matching `Activity` (including numeric `id` and `userId`).
- [ ] WHEN [a client calls `GET /activities/:id`] THE [System] SHALL return HTTP 200 with a DTO matching `Activity`.
- [ ] WHEN [a client calls `POST /activities` with valid data] THE [System] SHALL return HTTP 201 with a DTO matching `Activity`.
- [ ] WHEN [a client calls `PUT /activities/:id` with valid data] THE [System] SHALL return HTTP 200 with a DTO matching `Activity`.
- [ ] THE [System] SHALL preserve support for all client-declared `ActivityStatus` values: `draft`, `published`, `confirmed`, `sold-out`, `done`, `cancelled`.
- [ ] WHEN [a client calls `POST /bookings` with valid data] THE [System] SHALL return HTTP 201 with a DTO matching `Booking`, including `payment.method`, `payment.amount`, and `payment.status`.
- [ ] WHEN [a client calls `GET /bookings`] THE [System] SHALL return HTTP 200 with an array of DTOs matching `Booking`.
- [ ] WHEN [a client calls `GET /bookings/:id`] THE [System] SHALL return HTTP 200 with a DTO matching `Booking`.
- [ ] THE [System] SHALL represent booking payment status with values compatible with client `PaymentStatus`: `none`, `pending`, `paid`, `refunded`.
- [ ] THE [System] SHALL represent booking payment method with values compatible with client `PaymentMethod`: `none`, `cash`, `creditCard`, `paypal`.
- [ ] THE [System] SHALL not require client-side field remapping for `id`, `activityId`, `userId`, `date`, `participants`, `status`, or `payment` to satisfy client TypeScript types.
- [ ] WHEN [the API contract test suite validates runtime payloads against client DTO expectations] THE [System] SHALL pass all contract assertions for auth, activities, and bookings endpoints in secured mode.
- [ ] WHEN [the API runs in open security mode] THE [System] SHALL keep the same aligned DTO response shapes as in secured mode.

## Non-Goals

- Changes to authentication strategy, authorization rules, activity lifecycle rules, capacity checks, or payment business decisions.
- UI/client-side type redesign.
- Database or repository persistence redesign.
