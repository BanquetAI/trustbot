# Story 1.6: Organization Data Isolation

## Story Info
- **Epic**: 1 - Mission Control Core & Agent Visibility
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR53

## User Story

As an operator,
I want to see only data belonging to my organization,
So that multi-tenant security is maintained.

## Acceptance Criteria

### AC1: Organization Isolation
**Given** two operators from different organizations
**When** each views their Mission Control dashboard
**Then** each sees only their own organization's agents
**And** neither can access the other's data via API

### AC2: Direct URL Protection
**Given** a user attempts to access another org's agent via direct URL
**When** they navigate to `/agents/{otherOrgAgentId}`
**Then** they receive a 404 Not Found response
**And** no data from the other organization is exposed

### AC3: RLS Enforcement
**Given** Supabase RLS policies are in place
**When** any query is executed
**Then** results are automatically filtered by `org_id` from JWT claims

## Technical Implementation

### Database Changes (Supabase)

#### RLS Policies for `agents` Table
```sql
-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see agents from their org
CREATE POLICY "Users can view own org agents" ON agents
  FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id');

-- Policy: Users can only update own org agents (if applicable)
CREATE POLICY "Users can update own org agents" ON agents
  FOR UPDATE
  USING (org_id = auth.jwt() ->> 'org_id');
```

#### RLS Policies for `action_requests` Table
```sql
ALTER TABLE action_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org action_requests" ON action_requests
  FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert own org action_requests" ON action_requests
  FOR INSERT
  WITH CHECK (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update own org action_requests" ON action_requests
  FOR UPDATE
  USING (org_id = auth.jwt() ->> 'org_id');
```

#### RLS Policies for Future Tables
Apply same pattern to:
- `audit_logs`
- `investigations`
- `tribunal_votes`
- Any other org-scoped tables

### Files to Create
- `supabase/migrations/XXX_add_rls_policies.sql` - RLS migration

### Files to Modify
- JWT generation to include `org_id` claim (if not already present)

### Implementation Notes

#### JWT Claims Structure
```typescript
interface JWTClaims {
  sub: string;           // User ID
  org_id: string;        // Organization ID (CRITICAL for RLS)
  role: string;          // User role
  email: string;
  iat: number;
  exp: number;
}
```

#### API Security Layer
Even with RLS, add explicit checks in API handlers:
```typescript
// Double-check org_id in handlers
const userOrgId = c.get('orgId');
const agent = await getAgent(agentId);

if (!agent || agent.org_id !== userOrgId) {
  return c.json({
    type: 'not_found',
    title: 'Not Found',
    status: 404,
    detail: 'Agent not found'
  }, 404);
}
```

#### Integration Tests
```typescript
describe('Organization Isolation', () => {
  it('should not expose other org agents', async () => {
    // Setup: Create agents in two different orgs
    // Act: User from org1 tries to access org2 agent
    // Assert: Returns 404, not 403 (don't reveal existence)
  });

  it('should filter agent list by org', async () => {
    // Setup: Create agents in multiple orgs
    // Act: User requests agent list
    // Assert: Only sees own org agents
  });
});
```

### Dependencies
- Story 1.1 (RBAC middleware for org_id extraction)

## Definition of Done
- [x] RLS policies created for agents table
- [x] RLS policies created for action_requests table
- [x] org_id included in JWT claims
- [x] API handlers validate org_id
- [x] 404 returned for cross-org access (not 403)
- [x] Integration tests for cross-org isolation
- [x] Migration script created
- [x] Documentation of RLS patterns for future tables
