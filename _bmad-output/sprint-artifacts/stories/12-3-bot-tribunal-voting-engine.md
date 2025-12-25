# Story 12.3: Bot Tribunal Voting Engine

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR76 (Bot Tribunal voting for high-risk decisions)

## User Story

As a high-risk action request,
I want multiple AI validators to vote on my approval,
So that no single point of failure exists.

## Acceptance Criteria

### AC1: Validator Selection
**Given** a high-risk action requiring tribunal review
**When** creating a tribunal session
**Then** 3-5 qualified validators are selected

### AC2: Vote Collection
**Given** a tribunal session
**When** validators submit votes
**Then** votes with reasoning and confidence are recorded

### AC3: Consensus Calculation
**Given** all votes are in
**When** calculating consensus
**Then** unanimous/majority/split determination is made

### AC4: Recommendation Generation
**Given** the consensus result
**When** generating a recommendation
**Then** approve/deny/escalate with reasoning is returned

## Technical Implementation

### TribunalVotingEngine Service

`src/services/TribunalVotingEngine.ts` manages multi-agent voting:

```typescript
import { getTribunalVotingEngine } from './TribunalVotingEngine.js';

const engine = getTribunalVotingEngine();

// Register validators
engine.registerValidator({
    agentId: 'security_bot',
    name: 'Security Validator',
    tier: 'TRUSTED',
    trustScore: 900,
    specialization: 'security',
});

// Create tribunal session
const session = engine.createSession(
    actionRequest,
    gateResult,
    { minTrustScore: 700 }
);

// Validators submit votes
engine.submitVote(
    session.id,
    'security_bot',
    'approve',
    'No security concerns identified',
    0.9
);

// Check session status
console.log(session.status);       // 'pending' | 'voting' | 'decided'
console.log(session.consensus);    // 'unanimous_approve' | 'majority_deny' | ...
console.log(session.recommendation); // { decision, confidence, reasoning }
```

### Consensus Types

| Consensus | Description |
|-----------|-------------|
| `unanimous_approve` | All validators approve |
| `unanimous_deny` | All validators deny |
| `majority_approve` | More approvals than denials |
| `majority_deny` | More denials than approvals |
| `split` | Equal votes |
| `no_quorum` | Insufficient validators or votes |

### Vote Interface

```typescript
interface TribunalVote {
    validatorId: string;
    validatorName: string;
    decision: 'approve' | 'deny' | 'abstain';
    reasoning: string;
    confidence: number; // 0-1
    riskAssessment?: string;
    votedAt: Date;
}
```

### Session Lifecycle

```
pending → voting → decided
                 ↘ expired
                 ↘ cancelled
```

### Configuration

```typescript
interface TribunalConfig {
    minValidators: 3,           // Minimum validators required
    maxValidators: 5,           // Maximum validators
    votingTimeoutMs: 300000,    // 5 minutes
    requireUnanimousForCritical: true,
    minConfidence: 0.6,         // Minimum aggregate confidence
    weightByTrustScore: true,   // Weight votes by trust score
}

engine.updateConfig({ votingTimeoutMs: 600000 });
```

### Validator Selection

```typescript
// Select validators with criteria
const validators = engine.selectValidators({
    minTrustScore: 800,
    excludeAgents: ['conflicted_agent'],
    preferredSpecializations: ['security', 'compliance'],
});

// Manual validator management
engine.registerValidator(validator);
engine.unregisterValidator(agentId);
const allValidators = engine.getValidators();
```

### Recommendation Interface

```typescript
interface TribunalRecommendation {
    decision: 'approve' | 'deny' | 'escalate';
    consensus: ConsensusType;
    confidence: number;
    reasoning: string[];
    dissent?: string[];
    requiresHitl: boolean;
}
```

### Decision Rules

| Scenario | Decision |
|----------|----------|
| Unanimous approval | approve |
| Unanimous denial | deny |
| Majority approval (non-critical) | approve |
| Majority denial | deny |
| Split decision | escalate + HITL |
| No quorum | escalate + HITL |
| Critical + not unanimous | escalate + HITL |
| Low confidence | escalate + HITL |

### Events

```typescript
engine.on('session:created', (session) => { /* New session */ });
engine.on('vote:received', (session, vote) => { /* Vote submitted */ });
engine.on('consensus:reached', (session) => { /* All votes in */ });
engine.on('session:decided', (session) => { /* Final decision */ });
engine.on('session:expired', (session) => { /* Timeout */ });
```

### Session Timeout

```typescript
// Sessions automatically expire after votingTimeoutMs
// Partial votes are used to generate recommendation
// Expired sessions require HITL review

engine.updateConfig({ votingTimeoutMs: 10 * 60 * 1000 }); // 10 minutes
```

### Weighted Voting

When `weightByTrustScore` is enabled:
- Higher trust score validators have more influence
- Confidence is also factored into weight
- Helps prevent low-trust validators from overriding high-trust ones

### Session Management

```typescript
// Get session
const session = engine.getSession(sessionId);
const session = engine.getSessionByRequestId(requestId);

// Get pending sessions
const pending = engine.getPendingSessions();

// Cancel session
engine.cancelSession(sessionId, 'Reason');
```

### Statistics

```typescript
const stats = engine.getStats();
console.log(stats.totalSessions);      // 50
console.log(stats.pendingSessions);    // 3
console.log(stats.decidedSessions);    // 45
console.log(stats.expiredSessions);    // 2
console.log(stats.consensusBreakdown); // { unanimous_approve: 30, ... }
console.log(stats.averageVotingTime);  // 45000 (ms)
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/TribunalVotingEngine.ts` | Tribunal voting service |
| `src/services/TribunalVotingEngine.test.ts` | Unit tests (44 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Session Creation | 5 |
| Voting | 6 |
| Consensus Calculation | 7 |
| Weighted Consensus | 1 |
| Recommendation Generation | 5 |
| Session Timeout | 3 |
| Session Management | 6 |
| Validator Management | 3 |
| Configuration | 1 |
| Statistics | 1 |
| Lifecycle | 1 |
| Singleton | 2 |
| Events | 2 |
| **Total** | **44** |

### Running Tests

```bash
npx vitest run src/services/TribunalVotingEngine.test.ts
```

## Definition of Done
- [x] TribunalVotingEngine service created
- [x] Validator registration and selection
- [x] Session creation with validator assignment
- [x] Vote submission with reasoning and confidence
- [x] Consensus calculation (unanimous/majority/split)
- [x] Weighted voting by trust score
- [x] Recommendation generation
- [x] Critical action handling (require unanimous)
- [x] Session timeout and expiration
- [x] Session cancellation
- [x] Statistics tracking
- [x] Event emission
- [x] Comprehensive test suite (44 tests)
- [x] TypeScript compilation successful
