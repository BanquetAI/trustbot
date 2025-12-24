# Story 2.5: Trust Impact Preview

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR17

## User Story

As an operator,
I want to see the potential trust impact before approving or denying an action,
So that I can make informed decisions about how this affects agent trust scores.

## Acceptance Criteria

### AC1: Trust Impact Display
**Given** an operator views a pending action request
**When** they expand the action details
**Then** they see the predicted trust impact for both approve and deny outcomes
**And** the current agent trust score is displayed

### AC2: Impact Breakdown
**Given** the trust impact preview is displayed
**When** viewing the details
**Then** they see the impact factors (e.g., action type weight, history modifier)
**And** the estimated new trust score is shown

### AC3: Visual Indicators
**Given** a trust impact is shown
**When** the impact is positive
**Then** green indicators show score increase
**When** the impact is negative
**Then** red indicators show score decrease

## Technical Implementation

### API Specification

#### GET /api/v1/mission-control/decisions/:id/impact
Returns trust impact preview for a decision.

**Response:**
```json
{
  "currentTrust": 500,
  "agentId": "agent-uuid",
  "agentName": "DataProcessor-Alpha",
  "approveImpact": {
    "scoreDelta": 15,
    "newScore": 515,
    "factors": [
      { "name": "Action completion", "value": 10 },
      { "name": "History modifier", "value": 5 }
    ]
  },
  "denyImpact": {
    "scoreDelta": -25,
    "newScore": 475,
    "factors": [
      { "name": "Failed request", "value": -20 },
      { "name": "Operator override", "value": -5 }
    ]
  }
}
```

### Files to Create
- `web/src/components/mission-control/shared/TrustImpactPreview.tsx`
- `web/src/components/mission-control/shared/TrustImpactPreview.test.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add impact endpoint

## Definition of Done
- [x] GET /api/v1/mission-control/decisions/:id/impact endpoint working
- [x] TrustImpactPreview component created
- [x] Approve and deny impact shown with factors
- [x] Visual indicators for positive/negative impact
- [x] Unit tests for component (31 tests)
- [x] API integration test
