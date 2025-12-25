# Story 12.2: Auto-Approval System

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR75 (Auto-approval for low-risk actions)

## User Story

As the decision system,
I want to automatically approve low-risk actions from trusted agents,
So that routine tasks are executed without delay.

## Acceptance Criteria

### AC1: Eligibility Checking
**Given** an action request from an agent
**When** checking auto-approval eligibility
**Then** trust score, history, and category are validated

### AC2: Integration with Trust Gate
**Given** an eligible action request
**When** processing through auto-approval
**Then** TrustGateEngine confirms the decision

### AC3: Approval Rate Limiting
**Given** an agent making many requests
**When** the approval rate limit is exceeded
**Then** further auto-approvals are blocked

### AC4: Execution Tracking
**Given** an auto-approved action
**When** execution completes
**Then** success or failure is recorded

## Technical Implementation

### AutoApprovalService

`src/services/AutoApprovalService.ts` manages automatic approvals:

```typescript
import { getAutoApprovalService } from './AutoApprovalService.js';

const service = getAutoApprovalService();

// Attempt auto-approval
const record = service.tryAutoApprove(
    {
        id: 'req_123',
        agentId: 'agent_1',
        orgId: 'org_1',
        actionType: 'read_data',
        category: 'read',
        description: 'Read user profile',
        urgency: 'normal',
        requestedAt: new Date(),
    },
    {
        trustScore: 850,
        tier: 'TRUSTED',
        capabilities: ['execute', 'delegate'],
        recentFailures: 0,
        recentSuccesses: 20,
        actionHistory: new Map([['read_data', 10]]),
    }
);

if (record) {
    console.log(`Approved: ${record.id}`);

    // Later, record execution result
    service.recordExecution(record.id, 'success');
}
```

### Auto-Approval Criteria

| Criterion | Default | Description |
|-----------|---------|-------------|
| `minTrustScore` | 800 | Minimum trust score required |
| `maxRecentFailures` | 0 | Maximum recent failures allowed |
| `minActionHistory` | 3 | Minimum times agent has done this action |
| `eligibleCategories` | read, write, execute, external_api, data_access | Categories eligible for auto-approval |
| `blockedActions` | [] | Action types that are never auto-approved |
| `requiredCapabilities` | ['execute'] | Required capabilities |
| `maxApprovalsPerHour` | 50 | Rate limit per agent per hour |

### Eligibility Checking

```typescript
// Check eligibility before gate evaluation
const eligibility = service.checkEligibility(request, context);
if (!eligibility.eligible) {
    console.log(`Not eligible: ${eligibility.reason}`);
}

// Dry run - check if would approve without creating record
const preview = service.wouldAutoApprove(request, context);
console.log(preview.wouldApprove);    // true/false
console.log(preview.gateDecision);     // 'auto_approve' | 'tribunal_review' | ...
```

### Execution Tracking

```typescript
// Record successful execution
service.recordExecution(recordId, 'success');

// Record failed execution
service.recordExecution(recordId, 'failure');

// Get pending (unexecuted) approvals
const pending = service.getPendingApprovals(agentId, orgId);
```

### Record Retrieval

```typescript
// Get by record ID
const record = service.getRecord(id);

// Get by request ID
const record = service.getRecordByRequestId(requestId);

// Get agent's approvals
const approvals = service.getAgentApprovals(agentId, {
    limit: 10,
    since: new Date(Date.now() - 24 * 60 * 60 * 1000),
});

// Get org's approvals
const approvals = service.getOrgApprovals(orgId, { limit: 20 });
```

### Statistics

```typescript
// Get approval statistics
const stats = service.getStats(orgId);
console.log(stats.totalApprovals);      // 150
console.log(stats.successfulExecutions); // 145
console.log(stats.failedExecutions);     // 3
console.log(stats.pendingExecutions);    // 2
console.log(stats.approvalsByCategory);  // { read: 80, write: 50, execute: 20 }
console.log(stats.approvalsByAgent);     // { agent_1: 75, agent_2: 75 }
console.log(stats.approvalsByHour);      // [0, 2, 5, 8, ...] (24 hours)

// Get success rate
const rate = service.getSuccessRate(agentId, orgId);
console.log(`Success rate: ${(rate * 100).toFixed(1)}%`);
```

### Configuration

```typescript
// Set org-specific criteria
service.setOrgCriteria('org_strict', {
    minTrustScore: 950,
    maxApprovalsPerHour: 20,
    blockedActions: ['delete_user'],
});

// Update global criteria
service.updateCriteria({
    minTrustScore: 850,
    eligibleCategories: ['read', 'write'],
});

// Block/unblock actions
service.blockAction('dangerous_action');
service.blockAction('risky_action', 'org_1'); // Org-specific
service.unblockAction('dangerous_action');

// Get remaining approvals for rate limit
const remaining = service.getRemainingApprovals(agentId, orgId);
```

### Events

```typescript
service.on('approval:granted', (record) => {
    // Auto-approval was granted
    console.log(`Approved: ${record.id}`);
});

service.on('approval:executed', (record) => {
    // Approved action executed successfully
    console.log(`Executed: ${record.id}`);
});

service.on('approval:failed', (record) => {
    // Approved action failed during execution
    console.log(`Failed: ${record.id}`);
});

service.on('approval:rejected', (request, reason) => {
    // Request was not auto-approved
    console.log(`Rejected ${request.id}: ${reason}`);
});
```

### AutoApprovalRecord Interface

```typescript
interface AutoApprovalRecord {
    id: string;
    requestId: string;
    agentId: string;
    orgId: string;
    actionType: string;
    category: string;
    trustScore: number;
    tier: string;
    approvedAt: Date;
    executedAt?: Date;
    executionResult?: 'success' | 'failure';
    metadata?: Record<string, unknown>;
}
```

### Integration with TrustGateEngine

The AutoApprovalService uses TrustGateEngine for the final decision:

```typescript
// AutoApprovalService flow:
// 1. Check eligibility criteria (trust score, failures, category, etc.)
// 2. Call TrustGateEngine.evaluate() for final decision
// 3. Check approval rate limit
// 4. Create and store approval record
// 5. Emit events
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/AutoApprovalService.ts` | Auto-approval service |
| `src/services/AutoApprovalService.test.ts` | Unit tests (54 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Auto-Approval Evaluation | 8 |
| Eligibility Checking | 7 |
| Dry Run | 3 |
| Execution Tracking | 5 |
| Pending Approvals | 3 |
| Record Retrieval | 6 |
| Statistics | 4 |
| Success Rate | 3 |
| Configuration | 6 |
| Rate Limiting | 4 |
| Lifecycle | 2 |
| Singleton | 2 |
| Record Pruning | 1 |
| **Total** | **54** |

### Running Tests

```bash
npx vitest run src/services/AutoApprovalService.test.ts
```

## Definition of Done
- [x] AutoApprovalService created
- [x] Eligibility checking (trust score, failures, category, history)
- [x] Integration with TrustGateEngine
- [x] Approval rate limiting per agent
- [x] Execution tracking (success/failure)
- [x] Pending approval retrieval
- [x] Statistics and success rate calculation
- [x] Org-specific criteria configuration
- [x] Action blocking/unblocking
- [x] Event emission
- [x] Record pruning for memory management
- [x] Comprehensive test suite (54 tests)
- [x] TypeScript compilation successful
