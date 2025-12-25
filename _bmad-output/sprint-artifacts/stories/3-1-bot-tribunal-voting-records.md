# Story 3.1: Bot Tribunal Voting Records Display

## Story Info
- **Epic**: 3 - Governance & Tribunal Transparency
- **Status**: done
- **Completed**: 2025-12-23
- **Started**: 2025-12-23
- **FRs Covered**: FR19

## User Story

As a user,
I want to view Bot Tribunal voting records for high-risk decisions,
So that I understand how the AI council deliberated.

## Acceptance Criteria

### AC1: Tribunal Record Display
**Given** a decision was reviewed by the Bot Tribunal
**When** viewing the decision details
**Then** I see the tribunal voting record including:
**And** each voting agent's vote (approve/deny/abstain)
**And** each voting agent's reasoning
**And** each voting agent's confidence score
**And** the final tribunal recommendation

### AC2: Consensus Highlighting
**Given** the tribunal reached consensus
**When** displaying the record
**Then** the unanimous/majority decision is highlighted
**And** any dissenting votes are shown with reasoning

## Technical Implementation

### API Specification

#### GET /api/v1/mission-control/decisions/:id/tribunal
Returns tribunal voting record for a decision.

**Response:**
```json
{
  "decisionId": "uuid",
  "tribunalId": "tribunal-001",
  "status": "completed",
  "finalRecommendation": "approve",
  "consensus": "majority",
  "votedAt": "2025-12-23T10:00:00Z",
  "votes": [
    {
      "id": "vote-001",
      "agentId": "validator-1",
      "agentName": "RiskAssessor-Prime",
      "vote": "approve",
      "reasoning": "Action within normal operational parameters, low risk profile",
      "confidence": 0.92
    },
    {
      "id": "vote-002",
      "agentId": "validator-2",
      "agentName": "ComplianceCheck-Alpha",
      "vote": "approve",
      "reasoning": "No compliance violations detected, proper authorization chain",
      "confidence": 0.88
    },
    {
      "id": "vote-003",
      "agentId": "validator-3",
      "agentName": "SecurityGate-Beta",
      "vote": "deny",
      "reasoning": "Elevated risk due to recent similar action failures",
      "confidence": 0.75,
      "dissenting": true
    }
  ],
  "summary": {
    "approveCount": 2,
    "denyCount": 1,
    "abstainCount": 0,
    "totalVotes": 3,
    "averageConfidence": 0.85
  }
}
```

### Database Schema

```sql
CREATE TABLE tribunal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  action_request_id UUID REFERENCES action_requests(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  vote TEXT CHECK (vote IN ('approve', 'deny', 'abstain')) NOT NULL,
  reasoning TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  voted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tribunal_votes_action ON tribunal_votes(action_request_id);
CREATE INDEX idx_tribunal_votes_org ON tribunal_votes(org_id);
```

### Files to Create
- `supabase/migrations/20231223_005_tribunal_votes.sql`
- `web/src/components/mission-control/shared/TribunalRecord.tsx`
- `web/src/components/mission-control/shared/TribunalRecord.test.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add tribunal endpoint
- `web/src/types.ts` - Add TribunalVote types

### Dependencies
- Story 2.1 (Action requests table)

## Definition of Done
- [x] tribunal_votes migration created
- [x] GET /api/v1/mission-control/decisions/:id/tribunal endpoint working
- [x] TribunalRecord component created
- [x] Vote display with reasoning and confidence
- [x] Consensus/majority highlighting
- [x] Dissenting votes clearly marked
- [x] Unit tests for component (47 tests)
- [x] API integration tests
