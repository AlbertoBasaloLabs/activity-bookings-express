# PUT Partial Updates Compatibility Specification

- **Reference**: [PRD](/PRD.md) FR2, FR3, TR1, TR4.
- **Issue**: TBD
- **Status**: Planned

## Problem Description

Current clients send partial payloads to `PUT` endpoints when updating resources. The API currently enforces behavior that treats partial changes as invalid for some fields, forcing clients to use a separate `PATCH` endpoint for fields they expect to update through `PUT`. This creates compatibility issues, integration errors, and unnecessary client-side branching.

### User Stories

- As an **API client developer**, I want to **send partial updates with PUT** so that **existing clients remain compatible without endpoint-specific branching**.
- As a **product team**, we want **consistent update behavior for client integrations** so that **we reduce contract-related incidents and support effort**.
- As a **backend maintainer**, I want **PUT validation to accept partial payloads safely** so that **business rules are preserved while improving compatibility**.

## Solution Overview

### User/App interface

- Maintain `PUT` update endpoints as valid update entry points for partial payloads.
- Keep `PATCH` endpoints available where they already exist.
- Ensure clients can send only the fields they need to change in `PUT` requests.
- Preserve current authentication, authorization, and response format conventions.

### Model and logic

- Treat request fields in `PUT` updates as optional change candidates rather than mandatory full replacements.
- Validate only fields present in the request payload.
- Preserve domain rules for constrained fields (for example, lifecycle transitions) when those fields are included in `PUT`.
- Keep ownership and permission checks unchanged.
- Keep standardized error response shape unchanged.

### Persistence

- Persist merged resource state after applying valid partial changes from `PUT`.
- Unspecified fields must retain their previous stored values.
- No persistence technology or schema redesign is required.

## Acceptance Criteria

- [ ] WHEN [a client sends a `PUT` request with a subset of mutable fields] THE [System] SHALL accept the request if provided fields are valid and return the updated resource.
- [ ] WHEN [a client sends a `PUT` request omitting mutable fields] THE [System] SHALL preserve omitted fields with their existing values.
- [ ] WHEN [a client includes a constrained field in `PUT`] THE [System] SHALL enforce the same domain rules for that field as defined by the product lifecycle rules.
- [ ] WHEN [a client includes invalid values in provided `PUT` fields] THE [System] SHALL return HTTP 400 with standardized validation errors.
- [ ] WHEN [an unauthenticated client calls a protected `PUT` endpoint] THE [System] SHALL return HTTP 401.
- [ ] WHEN [an authenticated client attempts to update a resource they do not own] THE [System] SHALL return HTTP 403.
- [ ] WHEN [a client calls `PUT` for a non-existent resource] THE [System] SHALL return HTTP 404.
- [ ] THE [System] SHALL keep existing `PATCH` endpoints available and behaviorally consistent for their current use cases.
- [ ] WHEN [current clients execute their update flows using partial `PUT` payloads] THE [System] SHALL complete the flows without requiring client-side fallback to `PATCH`.

## Non-Goals

- Removal of existing `PATCH` endpoints.
- Changes to authentication strategy, authorization rules, or error response contract.
- Redesign of persistence technology or data model.
