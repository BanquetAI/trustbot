# Story 2.4: Deny Action Request

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR15, FR16

## User Story

As an operator,
I want to deny a pending agent action with a reason,
So that the agent knows why its action was rejected.

## Acceptance Criteria

### AC1: Deny Action with Reason
**Given** an operator views a pending action request
**When** they click the "Deny" button
**Then** a reason input is shown (optional but recommended)
**And** the denial is processed when submitted

### AC2: Denial Recorded
**Given** a denial is submitted
**When** processing completes
**Then** the action status updates to "denied"
**And** the denial reason is stored
**And** the decision is logged in the audit trail
**And** HITL metrics are recorded

### AC3: Error Handling
**Given** an error occurs during denial
**When** the server fails to process
**Then** the optimistic update is rolled back
**And** an error message is displayed to the operator

## Technical Implementation

### API Specification

#### POST /api/v1/mission-control/decisions/:id/deny
Denies a pending action request.

**Request Body:**
```json
{
  "reason": "Optional denial reason",
  "reviewMetrics": {
    "reviewTimeMs": 15000,
    "detailViewsAccessed": true,
    "sampleDataViewed": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "decision": {
    "id": "uuid",
    "status": "denied",
    "decidedBy": "user-uuid",
    "decidedAt": "2025-12-23T12:00:00Z",
    "reason": "Denial reason",
    "reviewMetrics": {
      "reviewTimeMs": 15000,
      "detailViewsAccessed": true,
      "sampleDataViewed": false
    }
  }
}
```

### Files Modified (from Story 2.3)
- `src/api/routes/mission-control/index.ts` - POST /decisions/:id/deny endpoint
- `web/src/stores/missionControlStore.ts` - denyDecisionOptimistic action

### Implementation Notes

The deny endpoint was implemented alongside the approve endpoint in Story 2.3 as they share:
- Same optimistic update pattern
- Same HITL metrics recording
- Same error handling and rollback logic

### Dependencies
- Story 2.3 (Approve Action Request - shared infrastructure)

## Definition of Done
- [x] POST /api/v1/mission-control/decisions/:id/deny endpoint working
- [x] Denial reason stored with decision
- [x] Optimistic UI updates implemented
- [x] Rollback on error works correctly
- [x] HITL metrics tracked
- [x] Audit trail entry created on deny
- [x] Unit tests for deny flow
- [x] Integration tests
