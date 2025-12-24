# Story 2.3: Approve Action Request

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR14

## User Story

As an operator,
I want to approve a pending agent action,
So that the agent can proceed with its work.

## Acceptance Criteria

### AC1: Approve Action
**Given** an operator views a pending action request
**When** they click the "Approve" button
**Then** the action is approved in the system
**And** the agent receives approval notification
**And** the decision is logged in the audit trail

### AC2: Optimistic Updates and HITL Metrics
**Given** an approval is submitted
**When** processing completes
**Then** the UI updates optimistically (immediately)
**And** the server confirms within 2 seconds
**And** HITL metrics are recorded (review time, context depth)

### AC3: Error Handling
**Given** an error occurs during approval
**When** the server fails to process
**Then** the optimistic update is rolled back
**And** an error message is displayed to the operator

## Technical Implementation

### API Specification

#### POST /api/v1/mission-control/decisions/:id/approve
Approves a pending action request.

**Request Body:**
```json
{
  "reviewNotes": "Optional notes about the approval"
}
```

**Response:**
```json
{
  "success": true,
  "decision": {
    "id": "uuid",
    "status": "approved",
    "decidedBy": "user-uuid",
    "decidedAt": "2025-12-23T12:00:00Z",
    "reviewMetrics": {
      "reviewTimeMs": 15000,
      "detailViewsAccessed": true,
      "sampleDataViewed": false
    }
  }
}
```

### Database Changes

#### hitl_metrics Table
```sql
CREATE TABLE IF NOT EXISTS hitl_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    user_id UUID NOT NULL,
    decision_id UUID NOT NULL REFERENCES action_requests(id),
    review_time_ms INTEGER NOT NULL,
    detail_views_accessed BOOLEAN DEFAULT false,
    sample_data_viewed BOOLEAN DEFAULT false,
    scroll_depth FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Files to Create
- `supabase/migrations/20231223_004_hitl_metrics.sql` - HITL metrics table

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add approve endpoint
- `web/src/stores/missionControlStore.ts` - Add optimistic update actions
- `web/src/components/mission-control/modules/TaskPipelineModule.tsx` - Wire up approve callback

### Implementation Notes

#### Optimistic Update Pattern
```typescript
// In store action
approveDecision: async (decisionId: string) => {
    // 1. Store original for rollback
    const original = get().queue.find(d => d.id === decisionId);

    // 2. Optimistic update
    set(state => ({
        queue: state.queue.map(d =>
            d.id === decisionId ? { ...d, status: 'approved' } : d
        )
    }));

    try {
        // 3. Server call
        await api.post(`/decisions/${decisionId}/approve`);
    } catch (error) {
        // 4. Rollback on error
        if (original) {
            set(state => ({
                queue: state.queue.map(d =>
                    d.id === decisionId ? original : d
                )
            }));
        }
        throw error;
    }
}
```

#### HITL Metrics Tracking
Track in browser before sending to API:
- `reviewStartTime`: When decision was first viewed
- `detailExpanded`: Whether details were expanded
- `sampleDataViewed`: Whether sample data modal was opened

### Dependencies
- Story 2.1 (TaskPipelineModule)

## Definition of Done
- [x] POST /api/v1/mission-control/decisions/:id/approve endpoint working
- [x] hitl_metrics table migration created
- [x] Optimistic UI updates implemented
- [x] Rollback on error works correctly
- [x] HITL metrics tracked (review time, detail views)
- [x] Audit trail entry created on approve
- [x] Unit tests for approve flow
- [x] Integration tests
