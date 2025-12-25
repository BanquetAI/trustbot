# Story 12.4: HITL Routing Engine

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR77 (HITL routing based on risk and urgency)

## User Story

As the decision system,
I want to route decisions to appropriate humans,
So that the right person reviews based on risk.

## Acceptance Criteria

### AC1: Risk-Based Routing
**Given** a request requiring human review
**When** routed to HITL
**Then** it goes to the appropriate reviewer role

### AC2: Urgency Handling
**Given** an urgent request
**When** routed to HITL
**Then** higher-level reviewers are assigned with notifications

### AC3: Escalation
**Given** a pending HITL request
**When** escalation is triggered
**Then** request moves to next reviewer level

### AC4: Timeout Handling
**Given** an HITL request
**When** timeout is reached without decision
**Then** request expires and is flagged

## Technical Implementation

### HITLRouter Service

`src/services/HITLRouter.ts` manages human-in-the-loop routing:

```typescript
import { getHITLRouter } from './HITLRouter.js';

const router = getHITLRouter();

// Register reviewers
router.registerReviewer({
    id: 'op1',
    name: 'John Operator',
    role: 'operator',
    email: 'john@example.com',
    orgId: 'org_1',
    isAvailable: true,
    currentLoad: 0,
    maxLoad: 10,
});

// Route a request to human review
const hitlRequest = router.routeToHuman(
    actionRequest,
    gateResult,
    'high' // urgency
);

// Submit decision
router.submitDecision(
    hitlRequest.id,
    'op1',
    'approved',
    'Low risk, safe to proceed'
);
```

### Routing Rules

| Risk | Urgency | Route To | Required Approvers | Timeout |
|------|---------|----------|-------------------|---------|
| Low | Any | Operator | 1 | 60 min |
| Medium | Low/Normal | Operator | 1 | 30 min |
| Medium | High | Supervisor | 1 | 15 min |
| High | Any | Supervisor | 1 | 15 min |
| Critical | Any | Director | 2 | 10 min |

### Reviewer Roles

| Role | Description |
|------|-------------|
| `operator` | Front-line reviewers |
| `supervisor` | Senior reviewers for high-risk |
| `director` | Executive approval for critical |
| `security_team` | Security specialists |

### Request Lifecycle

```
pending → assigned → in_review → decided
                               ↘ expired
                   ↓ (escalate)
                 escalated → assigned → ...
```

### Escalation

```typescript
// Manual escalation
router.escalate(hitlRequest.id, 'Needs supervisor review');

// Auto-escalation (configured per rule)
// High-risk requests auto-escalate after 10 minutes
// Critical requests auto-escalate after 5 minutes
```

### Escalation Path

```
operator → supervisor → director → security_team
```

### Reviewer Management

```typescript
// Register
router.registerReviewer(reviewer);

// Unregister
router.unregisterReviewer(reviewerId, orgId);

// Get reviewers
router.getReviewer(reviewerId, orgId);
router.getReviewersByRole('supervisor', orgId);
router.getAvailableReviewers('operator', orgId);

// Set availability
router.setReviewerAvailability(reviewerId, orgId, false);
```

### Load Balancing

When enabled (default), requests are distributed to reviewers with lowest current load:

```typescript
router.updateConfig({ loadBalance: true });
```

### Request Management

```typescript
// Get request
const request = router.getRequest(hitlRequestId);
const request = router.getRequestByRequestId(originalRequestId);

// Get reviewer's queue (sorted by urgency)
const queue = router.getReviewerQueue(reviewerId);

// Get all pending requests
const pending = router.getPendingRequests(orgId);
```

### Custom Routing Rules

```typescript
// Add custom rule
router.addRoutingRule({
    riskLevel: 'medium',
    urgency: 'immediate',
    routeTo: ['director'],
    requiredApprovers: 2,
    notifyRoles: ['supervisor', 'security_team'],
    timeoutMinutes: 5,
    autoEscalateAfter: 3,
});

// Replace all rules
router.setRoutingRules(customRules);
```

### Configuration

```typescript
interface HITLConfig {
    defaultTimeoutMinutes: 30,      // Default timeout
    autoEscalate: true,             // Enable auto-escalation
    escalationTimeoutMinutes: 15,   // Escalation timeout
    maxEscalationLevel: 3,          // Max escalation levels
    loadBalance: true,              // Load balance across reviewers
}

router.updateConfig({ maxEscalationLevel: 5 });
```

### Events

```typescript
router.on('request:created', (request) => { /* New HITL request */ });
router.on('request:assigned', (request, reviewers) => { /* Assigned */ });
router.on('request:approved', (request, approval) => { /* Approval */ });
router.on('request:denied', (request, approval) => { /* Denial */ });
router.on('request:decided', (request) => { /* Final decision */ });
router.on('request:escalated', (request) => { /* Escalation */ });
router.on('request:expired', (request) => { /* Timeout */ });
router.on('notification:send', (type, recipients, data) => { /* Send */ });
```

### Statistics

```typescript
const stats = router.getStats(orgId);
console.log(stats.totalRequests);      // 100
console.log(stats.pendingRequests);    // 5
console.log(stats.decidedRequests);    // 90
console.log(stats.expiredRequests);    // 5
console.log(stats.escalatedRequests);  // 10
console.log(stats.avgDecisionTimeMs);  // 120000
console.log(stats.approvalRate);       // 0.85
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/HITLRouter.ts` | HITL routing service |
| `src/services/HITLRouter.test.ts` | Unit tests (47 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Request Routing | 9 |
| Decision Submission | 7 |
| Escalation | 5 |
| Request Timeout | 3 |
| Reviewer Management | 6 |
| Request Management | 7 |
| Routing Rules | 3 |
| Configuration | 1 |
| Statistics | 1 |
| Load Balancing | 2 |
| Lifecycle | 1 |
| Singleton | 2 |
| **Total** | **47** |

### Running Tests

```bash
npx vitest run src/services/HITLRouter.test.ts
```

## Definition of Done
- [x] HITLRouter service created
- [x] Risk-based routing rules
- [x] Urgency-based prioritization
- [x] Reviewer registration and management
- [x] Load balancing across reviewers
- [x] Decision submission (approve/deny)
- [x] Escalation to higher levels
- [x] Auto-escalation before timeout
- [x] Request timeout and expiration
- [x] Notification event emission
- [x] Statistics tracking
- [x] Comprehensive test suite (47 tests)
- [x] TypeScript compilation successful
