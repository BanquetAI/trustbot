# Story 1.1: RBAC Middleware & Role-Based Access

## Story Info
- **Epic**: 1 - Mission Control Core & Agent Visibility
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR51, FR52, FR53

## User Story

As an operator,
I want the system to verify my role before allowing access to Mission Control,
So that only authorized users can view agent data.

## Acceptance Criteria

### AC1: Valid Role Access
**Given** a user with valid JWT token and role "operator"
**When** they request `/api/v1/mission-control/dashboard`
**Then** the request is allowed and returns 200
**And** the response includes only data for their organization

### AC2: Invalid Role Rejection
**Given** a user with valid JWT token but role "viewer"
**When** they request `/api/v1/mission-control/dashboard`
**Then** the request is denied with 403 Forbidden
**And** an RFC 7807 error response is returned

### AC3: Missing Token Rejection
**Given** a request without a valid JWT token
**When** they request any Mission Control endpoint
**Then** the request is denied with 401 Unauthorized

## Technical Implementation

### Files to Create
- `src/api/middleware/rbac.ts` - RBAC middleware with `requireRole()` function

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Apply RBAC middleware to routes

### Database Changes
- Add RLS policies for `agents` table
- Add RLS policies for `action_requests` table

### Implementation Notes
1. Create `requireRole(...roles: string[])` middleware factory
2. Extract role from JWT claims via Supabase auth
3. Return RFC 7807 error format for failures:
   ```typescript
   { type: 'authorization_error', title: 'Forbidden', status: 403, detail: 'message' }
   ```
4. Integrate with existing Supabase auth helpers
5. Add `org_id` extraction from JWT for RLS filtering

### Dependencies
- Supabase JWT verification (existing)
- Hono middleware pattern

## Definition of Done
- [x] `requireRole()` middleware created and tested
- [x] RFC 7807 error responses for 401/403
- [x] RLS policies created for agents and action_requests
- [x] Integration tests for role verification
- [x] Unit tests for middleware logic (28 tests passing)

## Deliverables
- `src/api/middleware/rbac.ts` - RBAC middleware with requireRole(), requireAuth(), requireOrgAccess()
- `src/api/middleware/rbac.test.ts` - 28 unit and integration tests
- `supabase/migrations/20231223_001_add_rls_policies.sql` - RLS policies for agents and action_requests
