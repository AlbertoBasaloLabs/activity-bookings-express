## Implementation Plan for bug-put-partial-updates.spec

- **Specification**: [bug-put-partial-updates.spec.md](./bug-put-partial-updates.spec.md)
- **PRD**: [FR2, FR3, TR1, TR4](../PRD.md)
- **Branch**: `fix/put-partial-updates`

### Step 1: Confirm behavior boundary and impacted endpoints
Define exact compatibility target for partial `PUT` updates without changing unrelated APIs.
- [ ] Confirm all update endpoints that currently use `PUT` and whether they already support partial payloads
- [ ] Confirm constrained fields that require domain-rule validation when present in `PUT` payloads
- [ ] Confirm `PATCH` endpoints remain supported and are not removed
- [ ] Capture expected status codes and error envelope for each update scenario

### Step 2: Align service-layer validation for partial PUT
Make `PUT` validation field-presence aware and keep domain protections.
- [ ] Update update-validation methods to validate only provided fields
- [ ] Keep ownership/authorization checks unchanged
- [ ] Enforce lifecycle transition rules when `status` is included in `PUT`
- [ ] Ensure merged-state validation still protects cross-field constraints (e.g., min/max participants)

### Step 3: Keep route-layer behavior contract-stable
Ensure routes preserve response and error contracts while accepting partial updates.
- [ ] Keep request handling in routes minimal and defer domain rules to services
- [ ] Preserve HTTP status mapping (`200`, `400`, `401`, `403`, `404`) for update flows
- [ ] Preserve standardized error response shape `{ message, errors }`
- [ ] Verify no route change introduces breaking DTO shape changes

### Step 4: Extend tests for partial PUT compatibility
Add regression coverage for client compatibility and domain rules.
- [ ] Add test: `PUT` with subset of mutable fields updates only those fields
- [ ] Add test: omitted fields remain unchanged after partial `PUT`
- [ ] Add test: constrained field in `PUT` follows lifecycle/domain rule validation
- [ ] Add test: invalid provided field values return `400` with validation errors
- [ ] Add test: auth/ownership/not-found behavior remains `401`/`403`/`404`

### Step 5: Validate implementation end-to-end
Run focused quality checks to verify safety and compatibility.
- [ ] Run `npm run typecheck`
- [ ] Run `npm test`
- [ ] Fix only issues related to this scope
- [ ] Re-run checks until green

### Step 6: Documentation and traceability updates
Keep project docs synchronized with behavior change.
- [ ] Update spec status and plan linkage
- [ ] Update endpoint documentation if it states `PUT` requires full replacement
- [ ] Add changelog note for partial `PUT` compatibility improvement
- [ ] Summarize migration impact as backward-compatible for current clients

### Data Model Impact
No entity or relationship changes are required for this improvement. Existing Activity, Booking, User, and Payment models remain unchanged; only update semantics and validation behavior are adjusted.
