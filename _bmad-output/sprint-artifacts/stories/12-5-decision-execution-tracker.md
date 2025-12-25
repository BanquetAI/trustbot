# Story 12.5: Decision Execution Tracker

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR78 (Decision execution tracking)

## User Story

As an operator,
I want to track approved action execution,
So that I know the outcome of my approvals.

## Acceptance Criteria

### AC1: Execution Queuing
**Given** an approved action
**When** queued for execution
**Then** it enters the execution queue

### AC2: Progress Tracking
**Given** an executing action
**When** progress updates occur
**Then** progress is tracked and emitted

### AC3: Completion Tracking
**Given** an executing action
**When** it completes or fails
**Then** the outcome is recorded

### AC4: Retry Handling
**Given** a failed execution
**When** retries are available
**Then** the action is re-queued

## Technical Implementation

### ExecutionTracker Service

`src/services/ExecutionTracker.ts` tracks decision execution:

```typescript
import { getExecutionTracker } from './ExecutionTracker.js';

const tracker = getExecutionTracker();

// Queue approved action for execution
const record = tracker.queueExecution(
    actionRequest,
    'auto_approval', // or 'tribunal' or 'hitl'
    approvalId
);

// Update progress
tracker.updateProgress(record.id, 50, 'Processing data...');

// Complete successfully
tracker.completeExecution(record.id, { result: 'success' });

// Or fail
tracker.failExecution(record.id, 'Network error');
```

### Execution States

```
queued → executing → completed
                   ↘ failed
                   ↘ timeout
                   ↘ cancelled
```

### Record Interface

```typescript
interface ExecutionRecord {
    id: string;
    requestId: string;
    request: ActionRequest;
    approvalSource: 'auto_approval' | 'tribunal' | 'hitl';
    approvalId?: string;
    status: ExecutionStatus;
    progress: number; // 0-100
    startedAt?: Date;
    completedAt?: Date;
    duration?: number; // ms
    result?: unknown;
    error?: string;
    retryCount: number;
    maxRetries: number;
    queuedAt: Date;
}
```

### Automatic Retry

```typescript
// Default: 3 retries
// When failExecution is called:
// - If retryCount < maxRetries: re-queue for retry
// - If retryCount >= maxRetries: mark as failed

tracker.updateConfig({ maxRetries: 5 });
```

### Concurrent Execution

```typescript
// Control how many executions run simultaneously
tracker.updateConfig({ maxConcurrent: 20 });

const queueStats = tracker.getQueueStats();
console.log(queueStats.executingCount);  // 10
console.log(queueStats.queueLength);     // 5
console.log(queueStats.available);       // 10
```

### Progress Tracking

```typescript
// Update progress during execution
tracker.updateProgress(recordId, 25, 'Step 1 complete');
tracker.updateProgress(recordId, 50, 'Step 2 complete');
tracker.updateProgress(recordId, 75, 'Step 3 complete');

// Get progress history
const history = tracker.getProgressHistory(recordId);
// Returns: [{ progress: 0, message: 'Started' }, ...]
```

### Timeouts

```typescript
// Execution timeout (default: 5 minutes)
tracker.updateConfig({ executionTimeoutMs: 10 * 60 * 1000 });

// Queue timeout - cancel if not started (default: 30 minutes)
tracker.updateConfig({ queueTimeoutMs: 60 * 60 * 1000 });
```

### Record Retrieval

```typescript
// Get by ID
const record = tracker.getRecord(recordId);

// Get by request ID
const record = tracker.getRecordByRequestId(requestId);

// Get agent's records
const records = tracker.getAgentRecords(agentId, {
    status: 'completed',
    limit: 10,
    since: new Date(Date.now() - 86400000),
});

// Get org's records
const records = tracker.getOrgRecords(orgId, { status: 'failed' });

// Get currently executing
const executing = tracker.getExecutingRecords();

// Get queued
const queued = tracker.getQueuedRecords();
```

### Events

```typescript
tracker.on('execution:queued', (record) => { /* Queued */ });
tracker.on('execution:started', (record) => { /* Started */ });
tracker.on('execution:progress', (record, progress) => { /* Progress */ });
tracker.on('execution:completed', (record) => { /* Success */ });
tracker.on('execution:failed', (record) => { /* Failed */ });
tracker.on('execution:cancelled', (record) => { /* Cancelled */ });
tracker.on('execution:timeout', (record) => { /* Timed out */ });
tracker.on('execution:retry', (record) => { /* Retrying */ });
```

### Statistics

```typescript
const stats = tracker.getStats(orgId);
console.log(stats.totalExecutions);     // 500
console.log(stats.queuedCount);         // 10
console.log(stats.executingCount);      // 20
console.log(stats.completedCount);      // 450
console.log(stats.failedCount);         // 15
console.log(stats.cancelledCount);      // 5
console.log(stats.averageDurationMs);   // 2500
console.log(stats.successRate);         // 0.968
console.log(stats.byApprovalSource);    // { auto_approval: 400, ... }
```

### Configuration

```typescript
interface ExecutionConfig {
    maxRetries: 3,              // Maximum retry attempts
    executionTimeoutMs: 300000, // 5 minutes
    queueTimeoutMs: 1800000,    // 30 minutes
    maxConcurrent: 10,          // Concurrent executions
    trackProgress: true,        // Track detailed progress
}

tracker.updateConfig({ maxConcurrent: 50 });
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/ExecutionTracker.ts` | Execution tracking service |
| `src/services/ExecutionTracker.test.ts` | Unit tests (41 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Queue Management | 4 |
| Start Execution | 3 |
| Progress Update | 4 |
| Complete Execution | 4 |
| Fail Execution | 4 |
| Cancel Execution | 4 |
| Execution Timeout | 2 |
| Queue Timeout | 1 |
| Record Retrieval | 9 |
| Statistics | 2 |
| Configuration | 1 |
| Lifecycle | 1 |
| Singleton | 2 |
| **Total** | **41** |

### Running Tests

```bash
npx vitest run src/services/ExecutionTracker.test.ts
```

## Definition of Done
- [x] ExecutionTracker service created
- [x] Execution queuing with concurrency control
- [x] Progress tracking and history
- [x] Completion and failure handling
- [x] Automatic retry on failure
- [x] Execution timeout
- [x] Queue timeout
- [x] Cancellation support
- [x] Record retrieval (by ID, request, agent, org)
- [x] Statistics and success rate
- [x] Event emission for all state changes
- [x] Comprehensive test suite (41 tests)
- [x] TypeScript compilation successful
