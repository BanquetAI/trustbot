# Story 12.6: Decision Timeout Handler

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR79 (Decision timeout handling)

## User Story

As the decision system,
I want decisions to timeout if not acted upon,
So that the queue doesn't grow indefinitely.

## Acceptance Criteria

### AC1: Urgency-Based Timeouts
**Given** a pending decision with urgency level
**When** the timeout period elapses
**Then** the appropriate action is taken

### AC2: Escalation on Timeout
**Given** an immediate/high urgency decision
**When** it times out
**Then** it is escalated to the next level

### AC3: Expiration on Timeout
**Given** a low urgency decision
**When** it times out
**Then** it expires and is removed

### AC4: Warning Notifications
**Given** a pending decision
**When** approaching timeout
**Then** a warning is emitted

## Technical Implementation

### DecisionTimeoutHandler

`src/jobs/DecisionTimeoutJob.ts` handles decision timeouts:

```typescript
import { getDecisionTimeoutHandler } from './DecisionTimeoutJob.js';

const handler = getDecisionTimeoutHandler();

// Register a decision for timeout tracking
const decision = handler.register(
    'dec_123',
    'req_456',
    'org_1',
    'high',     // urgency
    'tribunal'  // source
);

// Set callbacks for timeout handling
handler.onEscalate(async (decision) => {
    await escalateToSupervisor(decision);
    return true;
});

handler.onExpire(async (decision) => {
    await markAsExpired(decision);
    return true;
});

// When decision is resolved, remove from tracking
handler.resolve('dec_123');
```

### Timeout Rules

| Urgency | Timeout | Action | Warning |
|---------|---------|--------|---------|
| Immediate | 15 min | Escalate | 10 min |
| High | 1 hour | Escalate | 45 min |
| Normal | 4 hours | Expire | 3 hours |
| Low | 24 hours | Expire | 20 hours |

### Configuration

```typescript
interface TimeoutConfig {
    checkIntervalMs: 60000,      // Check every minute
    maxEscalations: 3,           // Max escalation levels
    warningGraceMs: 300000,      // 5 min warning grace
    autoProcess: true,           // Auto-process timeouts
}

handler.updateConfig({ maxEscalations: 5 });
```

### Custom Rules

```typescript
handler.setRule({
    urgency: 'immediate',
    timeoutMs: 5 * 60 * 1000,  // 5 minutes
    action: 'expire',          // Force expire instead of escalate
    warningMs: 3 * 60 * 1000,  // 3 minute warning
});
```

### Decision States

```
registered → (warning) → escalated/expired
                       ↘ resolved
```

### Events

```typescript
handler.on('decision:registered', (decision) => { /* Registered */ });
handler.on('decision:warning', (decision) => { /* Warning emitted */ });
handler.on('decision:escalated', (result) => { /* Escalated */ });
handler.on('decision:expired', (result) => { /* Expired */ });
handler.on('decision:resolved', (decision) => { /* Resolved */ });
handler.on('check:started', () => { /* Check cycle started */ });
handler.on('check:completed', (results) => { /* Check completed */ });
```

### Decision Retrieval

```typescript
// Get by ID
const decision = handler.getDecision(id);

// Get by request ID
const decision = handler.getDecisionByRequestId(requestId);

// Get all pending
const pending = handler.getPendingDecisions({
    orgId: 'org_1',
    urgency: 'high',
    source: 'tribunal',
});

// Get expiring soon (within 30 minutes)
const expiring = handler.getExpiringSoon(30 * 60 * 1000);
```

### Manual Processing

```typescript
// Start/stop automatic processing
handler.start();
handler.stop();

// Manual process all timeouts
const results = await handler.processTimeouts();
```

### Callbacks

```typescript
// Handle escalation
handler.onEscalate(async (decision) => {
    // Escalate the decision
    await escalate(decision);
    return true; // Success
});

// Handle expiration
handler.onExpire(async (decision) => {
    // Mark as expired
    await expire(decision);
    return true;
});

// Handle notification
handler.onNotify(async (decision) => {
    // Send notification
    await notify(decision);
    return true;
});
```

### Statistics

```typescript
const stats = handler.getStats(orgId);
console.log(stats.totalPending);    // 50
console.log(stats.byUrgency);       // { immediate: 5, high: 15, ... }
console.log(stats.bySource);        // { tribunal: 30, hitl: 20 }
console.log(stats.expiringSoon);    // 8
console.log(stats.escalatedCount);  // 12
```

### Files Created

| File | Purpose |
|------|---------|
| `src/jobs/DecisionTimeoutJob.ts` | Timeout handler |
| `src/jobs/DecisionTimeoutJob.test.ts` | Unit tests (34 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Registration | 3 |
| Resolve | 3 |
| Resolve By Request | 1 |
| Timeout Processing | 7 |
| Start/Stop | 3 |
| Decision Retrieval | 7 |
| Rules Configuration | 2 |
| Configuration | 1 |
| Statistics | 2 |
| Lifecycle | 1 |
| Singleton | 2 |
| **Total** | **34** |

### Running Tests

```bash
npx vitest run src/jobs/DecisionTimeoutJob.test.ts
```

## Definition of Done
- [x] DecisionTimeoutHandler created
- [x] Urgency-based timeout rules
- [x] Escalation on timeout (immediate/high)
- [x] Expiration on timeout (normal/low)
- [x] Warning notifications before timeout
- [x] Maximum escalation limit
- [x] Custom rule configuration
- [x] Automatic and manual processing
- [x] Callback handlers for escalate/expire/notify
- [x] Decision retrieval and filtering
- [x] Statistics tracking
- [x] Event emission
- [x] Comprehensive test suite (34 tests)
- [x] TypeScript compilation successful
