# Story 2.2: Morning Queue View

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR10

## User Story

As an operator,
I want to see a dedicated view of overnight decisions awaiting review,
So that I can efficiently process my morning queue.

## Acceptance Criteria

### AC1: Overnight Decision Filtering
**Given** an operator logs in during business hours
**When** they view the Morning Queue section
**Then** they see all decisions queued between 6 PM and 8 AM local time
**And** decisions are sorted by urgency, then by oldest first

### AC2: Count Badge Display
**Given** the morning queue has items
**When** viewing the queue
**Then** a count badge shows total pending decisions
**And** the queue loads within 3 seconds (NFR-P3)

### AC3: Real-time Updates on Processing
**Given** an operator processes a morning queue item
**When** they approve or deny it
**Then** the item is removed from the morning queue view
**And** the count badge updates immediately

## Technical Implementation

### API Specification

#### GET /api/v1/mission-control/queue/morning
Returns pending action requests from the overnight period.

**Query Parameters:**
- `timezone` (optional): User's timezone (default: UTC)
- `limit` (optional): Max items to return (default: 50, max: 100)

**Response:**
```json
{
  "queue": [
    {
      "id": "uuid",
      "agentId": "uuid",
      "agentName": "DataProcessor-Alpha",
      "actionType": "data_export",
      "urgency": "queued",
      "queuedReason": "Overnight batch processing",
      "trustGateRules": ["overnight_queue"],
      "createdAt": "2025-12-23T02:30:00Z",
      "timeInQueue": "6h 30m"
    }
  ],
  "counts": {
    "immediate": 1,
    "queued": 8,
    "total": 9
  },
  "period": {
    "start": "2025-12-22T18:00:00Z",
    "end": "2025-12-23T08:00:00Z"
  }
}
```

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add morning queue endpoint
- `web/src/components/mission-control/modules/TaskPipelineModule.tsx` - Add morning filter option

### Implementation Notes

#### Overnight Period Calculation
```typescript
function getOvernightPeriod(timezone: string = 'UTC'): { start: Date; end: Date } {
    const now = new Date();
    const today8am = new Date(now);
    today8am.setHours(8, 0, 0, 0);

    const yesterday6pm = new Date(now);
    yesterday6pm.setDate(yesterday6pm.getDate() - 1);
    yesterday6pm.setHours(18, 0, 0, 0);

    // If before 8am, use yesterday's 6pm to today's 8am
    // If after 8am, show empty (business hours)
    return { start: yesterday6pm, end: today8am };
}
```

#### Sorting Priority
1. Urgency: 'immediate' before 'queued'
2. Priority: Higher priority first
3. Time: Oldest first (FIFO)

### Dependencies
- Story 2.1 (TaskPipelineModule and queue endpoint)

## Definition of Done
- [x] GET /api/v1/mission-control/queue/morning endpoint working
- [x] Overnight period filtering (6 PM - 8 AM)
- [x] Count badge displays in UI
- [x] Sorting by urgency, then priority, then oldest
- [x] Performance under 3 seconds (NFR-P3)
- [x] Unit tests for overnight calculation
- [x] API integration test
