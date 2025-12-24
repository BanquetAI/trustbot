# Story 2.1: Task Pipeline Module - Pending Decisions View

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR7, FR11, FR12, FR13

## User Story

As an operator,
I want to see all pending action requests requiring my approval,
So that I can prioritize my review work.

## Acceptance Criteria

### AC1: Pending Requests Display
**Given** an operator is authenticated
**When** they view the Task Pipeline Module
**Then** they see all pending action requests for their organization
**And** each request shows: agent name, action type, requested time, urgency

### AC2: Urgency Indicators
**Given** a pending decision exists
**When** displayed in the queue
**Then** urgency indicators show "IMMEDIATE" (red) or "QUEUED" (yellow)
**And** time-in-queue duration is displayed (e.g., "2h 15m")

### AC3: Queue Routing Explanation
**Given** a decision has been queued vs immediate
**When** viewing the decision
**Then** an explanation is available showing why it was routed that way
**And** the explanation references the Trust Gate decision

## Technical Implementation

### Database Changes (Supabase)

#### action_requests Table Schema
```sql
CREATE TABLE IF NOT EXISTS action_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    action_type VARCHAR(50) NOT NULL,
    action_payload JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    urgency VARCHAR(20) NOT NULL DEFAULT 'queued',
    queued_reason TEXT,
    trust_gate_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queue queries
CREATE INDEX idx_action_requests_org_status
    ON action_requests(org_id, status)
    WHERE status = 'pending';
```

### Files to Create
- `web/src/components/mission-control/modules/TaskPipelineModule.tsx` - Main module component
- `web/src/components/mission-control/modules/TaskPipelineModule.test.tsx` - Tests
- `web/src/components/mission-control/shared/UrgencyBadge.tsx` - Urgency indicator
- `web/src/components/mission-control/shared/QueueDuration.tsx` - Time-in-queue display
- `src/api/routes/mission-control/queue.ts` - Queue API endpoint
- `supabase/migrations/20231223_003_action_requests.sql` - Database migration

### Files to Modify
- `web/src/types.ts` - Add ActionRequest interface
- `web/src/stores/missionControlStore.ts` - Add queue state
- `src/api/routes/mission-control/index.ts` - Register queue routes

### API Specification

#### GET /api/v1/mission-control/queue
Returns pending action requests for the authenticated user's organization.

**Response:**
```json
{
  "queue": [
    {
      "id": "uuid",
      "agentId": "uuid",
      "agentName": "DataProcessor-Alpha",
      "actionType": "data_export",
      "urgency": "immediate",
      "queuedReason": "Action involves sensitive data export",
      "trustGateRules": ["high_risk_action", "low_trust_agent"],
      "createdAt": "2025-12-23T08:30:00Z",
      "timeInQueue": "2h 15m"
    }
  ],
  "counts": {
    "immediate": 3,
    "queued": 12,
    "total": 15
  }
}
```

### Component Design

```typescript
interface TaskPipelineModuleProps {
    onDecisionClick?: (decision: ActionRequest) => void;
    showFilters?: boolean;
    className?: string;
}

// Uses compound component pattern
<TaskPipelineModule>
    <TaskPipelineModule.Header title="Decision Queue" />
    <TaskPipelineModule.Filters />
    <TaskPipelineModule.List>
        <TaskPipelineModule.Item decision={decision} />
    </TaskPipelineModule.List>
    <TaskPipelineModule.Footer />
</TaskPipelineModule>
```

### Dependencies
- Story 1.1 (RBAC middleware for auth)
- Story 1.2 (Zustand store)
- Story 1.3 (Module compound component pattern)

## Definition of Done
- [x] action_requests table migration created
- [x] GET /api/v1/mission-control/queue endpoint working
- [x] TaskPipelineModule displays pending decisions
- [x] UrgencyBadge shows IMMEDIATE (red) / QUEUED (yellow)
- [x] QueueDuration shows formatted time-in-queue
- [x] Queue routing explanation displayed on expand
- [x] Unit tests for all components
- [x] API integration test
- [x] RLS policies for action_requests table
