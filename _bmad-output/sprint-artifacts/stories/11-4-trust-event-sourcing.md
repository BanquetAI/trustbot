# Story 11.4: Trust Event Sourcing

## Story Info
- **Epic**: 11 - Live Trust Scoring Engine
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR71 (Trust score event sourcing for audit)

## User Story

As an auditor,
I want immutable trust event logs,
So that trust changes are fully traceable.

## Acceptance Criteria

### AC1: Event Record Creation
**Given** a score change occurs
**When** it is recorded
**Then** an immutable event record is created

### AC2: Append-Only Storage
**Given** an event is stored
**When** attempting to modify it
**Then** the modification is blocked or detected

### AC3: Hash Chain Integrity
**Given** a chain of events exists
**When** verifying the chain
**Then** tampered events are detected

### AC4: Query API
**Given** stored trust events
**When** querying by various filters
**Then** relevant events are returned with pagination

## Technical Implementation

### TrustEventStore Service

`src/services/TrustEventStore.ts` provides event sourcing with hash chain integrity:

```typescript
const store = new TrustEventStore();

// Append event (immutable)
const event = store.append({
    agentId: 'agent_1',
    orgId: 'org_1',
    eventType: 'task_completed',
    points: 10,
    oldScore: 300,
    newScore: 310,
    reason: 'Task finished successfully',
});

// Event includes hash chain
console.log(event.hash);        // SHA-256 hash
console.log(event.previousHash); // Previous event's hash
console.log(event.sequence);     // Agent-specific sequence number
```

### Event Types

| Event Type | Description |
|------------|-------------|
| `task_completed` | Agent completed a task successfully |
| `task_reviewed_positive` | Task received positive review |
| `task_reviewed_negative` | Task received negative review |
| `task_failed` | Agent failed to complete task |
| `task_timeout` | Task timed out |
| `invalid_delegation` | Invalid delegation attempt |
| `security_violation` | Security policy violated |
| `manual_adjustment` | Manual score adjustment |
| `tier_promotion` | Agent promoted to higher tier |
| `tier_demotion` | Agent demoted to lower tier |
| `score_decay` | Score decayed over time |
| `score_reset` | Score was reset |

### Hash Chain

Each event contains:
- `hash`: SHA-256 of event data + previousHash
- `previousHash`: Hash of the previous event (or genesis hash for first event)
- `sequence`: Agent-specific event sequence number

```typescript
// Genesis hash for first event
const GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';

// Each event's hash includes previous hash, creating tamper-evident chain
event2.previousHash === event1.hash; // true
```

### Retrieval API

```typescript
// By ID
store.getById('agent_1:1'): TrustEvent | null

// By sequence
store.getBySequence('agent_1', 1): TrustEvent | null

// Agent events with filtering
store.getAgentEvents(agentId, {
    startTime: Date.now() - 86400000,
    endTime: Date.now(),
    eventTypes: ['task_completed', 'task_failed'],
    limit: 50,
    offset: 0,
    order: 'desc'
}): TrustEvent[]

// Org events
store.getOrgEvents(orgId, options): TrustEvent[]

// Latest event
store.getLatestEvent(agentId): TrustEvent | null

// Event count
store.getEventCount(agentId): number

// Sequence number
store.getSequence(agentId): number
```

### Verification API

```typescript
// Verify single event hash
store.verifyEvent('agent_1:1'): boolean

// Verify entire agent chain
const result = store.verifyAgentChain('agent_1');
// Returns: { valid: true, checkedEvents: 10, errors: [] }

// Verify org chain (all agents)
const orgResult = store.verifyOrgChain('org_1');
// Returns: { valid: true, checkedEvents: 50, errors: [] }

// IntegrityCheckResult
interface IntegrityCheckResult {
    valid: boolean;
    checkedEvents: number;
    firstInvalidSequence?: number;
    errors: string[];
}
```

### Replay / State Reconstruction

```typescript
// Replay to reconstruct state at a point in time
const scoreAtTime = store.replayToTime(
    'agent_1',
    Date.parse('2025-01-15T12:00:00Z'),
    300 // baseScore
);

// Replay to specific sequence
const scoreAtSeq = store.replayToSequence('agent_1', 5, 300);

// Get score history for charting
const history = store.getScoreHistory('agent_1');
// Returns: [{ timestamp: 1234567890, score: 310 }, ...]
```

### Statistics API

```typescript
const stats = store.getStats('org_1');
// Returns: {
//   totalEvents: 100,
//   eventsByType: { task_completed: 50, task_failed: 10, ... },
//   eventsByAgent: { agent_1: 30, agent_2: 70 },
//   oldestEvent: 1234567890,
//   newestEvent: 1234567999
// }

// Points delta in time range
const delta = store.getPointsDelta('agent_1', startTime, endTime);
```

### Events Emitted

```typescript
store.on('event:appended', (event: TrustEvent) => {
    // Handle new event
});
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/TrustEventStore.ts` | Event sourcing service |
| `src/services/TrustEventStore.test.ts` | Unit tests (35 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Event Appending | 8 |
| Event Retrieval | 10 |
| Hash Chain Verification | 5 |
| Replay | 3 |
| Statistics | 4 |
| Immutability | 2 |
| Custom Configuration | 1 |
| Lifecycle | 2 |
| **Total** | **35** |

### Running Tests

```bash
npx vitest run src/services/TrustEventStore.test.ts
```

## Integration Example

```typescript
import { getTrustScoreCalculator } from './TrustScoreCalculator.js';
import { getTrustEventStore } from './TrustEventStore.js';
import { getTierManager } from './TierManager.js';

const calculator = getTrustScoreCalculator();
const eventStore = getTrustEventStore();
const tierManager = getTierManager();

// Record all trust changes to event store
calculator.on('score:changed', (change) => {
    eventStore.append({
        agentId: change.agentId,
        orgId: getAgentOrg(change.agentId),
        eventType: change.eventType,
        points: change.delta,
        oldScore: change.oldScore,
        newScore: change.newScore,
        reason: change.reason,
    });
});

// Record tier changes
tierManager.on('tier:promotion', (change) => {
    eventStore.append({
        agentId: change.agentId,
        orgId: change.orgId,
        eventType: 'tier_promotion',
        points: 0,
        oldScore: change.score,
        newScore: change.score,
        metadata: {
            previousTier: change.previousTier,
            newTier: change.newTier,
        },
    });
});

// Audit: Verify integrity
async function auditTrustChain(orgId: string) {
    const result = eventStore.verifyOrgChain(orgId);
    if (!result.valid) {
        console.error('Trust chain integrity violation!', result.errors);
    }
    return result;
}

// Reconstruct score at audit point
function getScoreAtAuditPoint(agentId: string, auditTime: Date): number {
    return eventStore.replayToTime(agentId, auditTime.getTime(), 300);
}
```

## Security Considerations

1. **Hash Chain**: Each event's hash includes the previous hash, making tampering detectable
2. **Append-Only**: Events cannot be modified after creation
3. **Sequence Numbers**: Per-agent sequences prevent event injection
4. **Genesis Hash**: Customizable per-organization for isolation
5. **Verification API**: Easy integrity checking for audits

## Definition of Done
- [x] TrustEventStore service created
- [x] Append-only event storage
- [x] SHA-256 hash chain for tamper detection
- [x] Verification API for chain integrity
- [x] Query API with filtering and pagination
- [x] State replay/reconstruction capability
- [x] Statistics and analytics
- [x] Event emission for subscribers
- [x] Comprehensive test suite (35 tests)
- [x] TypeScript compilation successful
