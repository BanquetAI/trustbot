# Story 3.3: HITL Override with Rationale

## Story Info
- **Epic**: 3 - Governance & Tribunal Transparency
- **Status**: complete
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR21

## User Story

As a HITL operator,
I want to override Bot Tribunal decisions with documented rationale,
So that human judgment can correct AI errors.

## Acceptance Criteria

### AC1: Override Option
**Given** a Bot Tribunal recommended denial
**When** I believe approval is appropriate
**Then** I can select "Override Tribunal" option
**And** I must provide detailed rationale for the override

### AC2: Override Logging
**Given** an override is submitted
**When** processing completes
**Then** the override is logged in the audit trail
**And** the rationale is attached to the decision record
**And** the tribunal is notified of the override for learning

### AC3: Rationale Validation
**Given** override rationale is required
**When** submitting without rationale
**Then** the submission is blocked
**And** an error message indicates rationale is mandatory

## Technical Implementation

### Types

```typescript
export interface OverrideRequest {
    decisionId: string;
    rationale: string;
    overrideType: 'approve' | 'deny';
    originalRecommendation: 'approve' | 'deny' | 'abstain';
}

export interface OverrideRecord {
    id: string;
    decisionId: string;
    tribunalId: string;
    overriddenBy: string;
    overriddenByName: string;
    overrideType: 'approve' | 'deny';
    originalRecommendation: 'approve' | 'deny' | 'abstain';
    rationale: string;
    overriddenAt: string;
}

export interface TribunalRecordWithOverride extends TribunalRecord {
    override?: OverrideRecord;
}
```

### API Specification

#### POST /api/v1/mission-control/decisions/:id/override
Overrides a Bot Tribunal decision with rationale.

**Request:**
```json
{
  "overrideType": "approve",
  "rationale": "After reviewing the agent's recent performance metrics and consulting with the security team, the elevated risk identified by the tribunal is mitigated by existing safeguards."
}
```

**Response:**
```json
{
  "success": true,
  "override": {
    "id": "override-001",
    "decisionId": "ar-001",
    "tribunalId": "trib-001",
    "overriddenBy": "user-123",
    "overriddenByName": "John Operator",
    "overrideType": "approve",
    "originalRecommendation": "deny",
    "rationale": "...",
    "overriddenAt": "2025-12-23T12:00:00Z"
  },
  "decision": {
    "id": "ar-001",
    "status": "approved",
    "decidedBy": "user-123",
    "decidedAt": "2025-12-23T12:00:00Z"
  }
}
```

**Validation:**
- `rationale` must be at least 50 characters (meaningful explanation)
- `overrideType` must be different from tribunal recommendation
- User must have operator role or higher

### Files to Create
- `web/src/components/mission-control/shared/OverrideRationale.tsx`
- `web/src/components/mission-control/shared/OverrideRationale.test.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add override endpoint
- `web/src/types.ts` - Add OverrideRecord types

### Dependencies
- Story 3.1 (Tribunal records)

## Definition of Done
- [x] OverrideRecord types added to types.ts
- [x] POST /api/v1/mission-control/decisions/:id/override endpoint working
- [x] OverrideRationale component created with textarea
- [x] Rationale validation (minimum 50 characters)
- [x] Override logged to audit trail
- [x] Tribunal status updated to 'overridden'
- [x] Unit tests for component (45 tests passing)
- [x] API integration tests
