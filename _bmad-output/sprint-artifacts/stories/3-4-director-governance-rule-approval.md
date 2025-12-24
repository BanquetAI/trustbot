# Story 3.4: Director Governance Rule Approval

## Story Info
- **Epic**: 3 - Governance & Tribunal Transparency
- **Status**: complete
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR22

## User Story

As a director,
I want to approve proposed governance rule changes with impact analysis,
So that rule changes are properly authorized.

## Acceptance Criteria

### AC1: View Pending Rule Changes
**Given** a governance rule change is proposed
**When** I view the proposal in my Director queue
**Then** I see the proposed change with:
- Current rule definition
- Proposed new rule definition
- Impact analysis (affected agents, estimated approval rate change)

### AC2: Approve Rule Change
**Given** I approve a rule change
**When** the change is activated
**Then** the new rule takes effect immediately
**And** all pending decisions are re-evaluated against new rules
**And** the change is logged with my authorization

### AC3: Deny Rule Change
**Given** I deny a rule change
**When** the denial is processed
**Then** the proposer is notified with my feedback
**And** the proposal is archived with denial reason

## Technical Implementation

### Types

```typescript
export type GovernanceRuleType =
    | 'trust_threshold'
    | 'action_permission'
    | 'rate_limit'
    | 'tier_requirement'
    | 'time_restriction';

export type GovernanceRuleStatus = 'draft' | 'pending' | 'approved' | 'denied' | 'archived';

export interface GovernanceRuleDefinition {
    type: GovernanceRuleType;
    threshold?: number;
    actions?: string[];
    tierRequired?: number;
    schedule?: { start: string; end: string };
    description: string;
}

export interface GovernanceRuleImpact {
    affectedAgentCount: number;
    estimatedApprovalRateChange: number; // -100 to +100
    affectedActionTypes: string[];
    riskLevel: 'low' | 'medium' | 'high';
}

export interface GovernanceRule {
    id: string;
    orgId: string;
    name: string;
    status: GovernanceRuleStatus;
    version: number;
    currentDefinition: GovernanceRuleDefinition;
    proposedDefinition?: GovernanceRuleDefinition;
    impact?: GovernanceRuleImpact;

    // Proposal tracking
    proposedBy: string;
    proposedByName: string;
    proposedAt: string;
    proposalReason: string;

    // Decision tracking
    decidedBy?: string;
    decidedByName?: string;
    decidedAt?: string;
    decisionReason?: string;

    createdAt: string;
    updatedAt: string;
}

export interface GovernanceRuleDecision {
    ruleId: string;
    action: 'approve' | 'deny';
    reason: string;
}
```

### API Specification

#### GET /api/v1/mission-control/rules/pending
Returns pending governance rule proposals for director review.

**Response:**
```json
{
  "rules": [
    {
      "id": "rule-001",
      "orgId": "org-123",
      "name": "High-Risk Action Trust Threshold",
      "status": "pending",
      "version": 2,
      "currentDefinition": {
        "type": "trust_threshold",
        "threshold": 600,
        "actions": ["data_delete", "bulk_update"],
        "description": "Minimum trust score for high-risk data operations"
      },
      "proposedDefinition": {
        "type": "trust_threshold",
        "threshold": 700,
        "actions": ["data_delete", "bulk_update", "schema_modify"],
        "description": "Increased threshold and added schema modifications"
      },
      "impact": {
        "affectedAgentCount": 12,
        "estimatedApprovalRateChange": -15,
        "affectedActionTypes": ["data_delete", "bulk_update", "schema_modify"],
        "riskLevel": "medium"
      },
      "proposedBy": "user-456",
      "proposedByName": "Jane Supervisor",
      "proposedAt": "2025-12-23T10:00:00Z",
      "proposalReason": "Recent security audit recommended stricter thresholds"
    }
  ],
  "counts": {
    "pending": 3,
    "approved": 15,
    "denied": 2
  }
}
```

#### POST /api/v1/mission-control/rules/:id/decide
Approve or deny a governance rule proposal.

**Request:**
```json
{
  "action": "approve",
  "reason": "Approved per security audit recommendations. Impact analysis shows acceptable reduction in approval rate."
}
```

**Response:**
```json
{
  "success": true,
  "rule": {
    "id": "rule-001",
    "status": "approved",
    "version": 2,
    "decidedBy": "user-789",
    "decidedByName": "Director Smith",
    "decidedAt": "2025-12-23T14:00:00Z",
    "decisionReason": "Approved per security audit recommendations..."
  }
}
```

**Validation:**
- User must have Director role
- `reason` must be at least 20 characters
- Rule must be in 'pending' status

### Files to Create
- `web/src/components/mission-control/shared/GovernanceRuleCard.tsx`
- `web/src/components/mission-control/shared/GovernanceRuleCard.test.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add governance endpoints
- `web/src/types.ts` - Add GovernanceRule types

### Dependencies
- Story 1.1 (RBAC middleware for Director role check)

## Definition of Done
- [x] GovernanceRule types added to types.ts
- [x] GET /api/v1/mission-control/rules/pending endpoint working
- [x] POST /api/v1/mission-control/rules/:id/decide endpoint working
- [x] GovernanceRuleCard component created
- [x] Impact analysis display (affected agents, approval rate change)
- [x] Approve/deny workflow with reason capture
- [x] Unit tests for component (57 tests passing)
- [x] API integration tests
