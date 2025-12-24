# Story 3.2: Trust Gate Decision Explanations

## Story Info
- **Epic**: 3 - Governance & Tribunal Transparency
- **Status**: complete
- **Completed**: 2025-12-23
- **Started**: 2025-12-23
- **FRs Covered**: FR20

## User Story

As a user,
I want to see Trust Gate decisions explaining why actions required approval,
So that I understand the governance rules applied.

## Acceptance Criteria

### AC1: Trust Gate Explanation Display
**Given** an action was routed to HITL review
**When** viewing the pending decision
**Then** I see the Trust Gate explanation including:
**And** which rule triggered the review (trust score, risk level, action type)
**And** the threshold that was exceeded
**And** the agent's current tier and permissions

### AC2: Multiple Rules Display
**Given** multiple rules triggered the review
**When** displaying the explanation
**Then** all applicable rules are listed
**And** the primary trigger is highlighted

## Technical Implementation

### Types

```typescript
export type TrustGateRuleType =
  | 'trust_score_threshold'
  | 'risk_level'
  | 'action_type'
  | 'tier_permission'
  | 'rate_limit'
  | 'first_time_action';

export interface TrustGateRule {
  id: string;
  type: TrustGateRuleType;
  name: string;
  description: string;
  threshold?: number;
  currentValue?: number;
  exceeded: boolean;
  isPrimary?: boolean;
}

export interface TrustGateExplanation {
  decisionId: string;
  agentId: string;
  agentName: string;
  agentTier: number;
  agentTrustScore: number;
  rules: TrustGateRule[];
  summary: string;
}
```

### API Specification

#### GET /api/v1/mission-control/decisions/:id/trust-gate
Returns Trust Gate explanation for why a decision required review.

**Response:**
```json
{
  "decisionId": "uuid",
  "agentId": "agent-123",
  "agentName": "DataProcessor-Alpha",
  "agentTier": 2,
  "agentTrustScore": 450,
  "rules": [
    {
      "id": "rule-001",
      "type": "trust_score_threshold",
      "name": "Trust Score Below Threshold",
      "description": "Agent trust score (450) is below the required threshold (600) for autonomous execution",
      "threshold": 600,
      "currentValue": 450,
      "exceeded": true,
      "isPrimary": true
    },
    {
      "id": "rule-002",
      "type": "action_type",
      "name": "High-Risk Action Type",
      "description": "Action type 'data_export' requires HITL approval regardless of trust score",
      "exceeded": true,
      "isPrimary": false
    }
  ],
  "summary": "This action required human approval due to 2 governance rules"
}
```

### Files to Create
- `web/src/components/mission-control/shared/TrustGateExplanation.tsx`
- `web/src/components/mission-control/shared/TrustGateExplanation.test.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add trust-gate endpoint
- `web/src/types.ts` - Add TrustGateRule types

### Dependencies
- Story 2.1 (Action requests with trust_gate_rules field)

## Definition of Done
- [x] TrustGateRule types added to types.ts
- [x] GET /api/v1/mission-control/decisions/:id/trust-gate endpoint working
- [x] TrustGateExplanation component created
- [x] Rule type display with icons
- [x] Primary trigger highlighting
- [x] Threshold vs current value comparison
- [x] Unit tests for component (46 tests)
